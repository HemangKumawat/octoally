import { FastifyPluginAsync } from 'fastify';
import {
  attachTerminal, writeToSession, resizeSession, reconnectSession,
  getPendingSpawn, consumePendingSpawn, spawnSession, spawnTerminal, spawnAdopt, spawnAgent,
  sendReplay, isSessionActive, readRecentOutput,
} from '../services/session-manager.js';
import { getDb } from '../db/index.js';
import { inputAuthEnabled, isInputTokenValid } from '../lib/input-auth.js';
import { strip } from '../lib/ansi.js';
import { getTracker } from '../services/session-state.js';

interface TerminalListRow {
  id: string;
  task: string | null;
  projectId: string | number | null;
  projectName: string | null;
  projectPath: string | null;
  status: string;
  pid: number | null;
  cliType: string | null;
  startedAt: string | number | null;
  updatedAt: string | number | null;
}

/**
 * Terminal WebSocket route
 * Connect to /api/terminal/:sessionId to get live PTY output and send input
 *
 * Supports "lazy spawn": sessions created via REST stay pending until the
 * first WebSocket sends a resize with actual terminal dimensions. This
 * ensures tmux is created at the exact right size — no resize/redraw needed.
 */
export const terminalRoutes: FastifyPluginAsync = async (app) => {
  // REST: live terminals with process state + meta-task label.
  // Plugin is registered with prefix '/api', so these serve /api/terminals.
  // Consumed by mcp-server/server.ts. Same (open) auth as neighboring GETs.
  app.get('/terminals', async () => {
    const rows = getDb().prepare(`
      SELECT
        s.id,
        s.task,
        s.project_id AS projectId,
        p.name AS projectName,
        p.path AS projectPath,
        s.status,
        s.pid,
        s.cli_type AS cliType,
        s.started_at AS startedAt,
        s.updated_at AS updatedAt
      FROM sessions s
      LEFT JOIN projects p ON p.id = s.project_id
      WHERE s.status IN ('pending', 'launching', 'running', 'detached')
      ORDER BY s.started_at DESC
    `).all() as TerminalListRow[];

    return rows.map((row) => {
      const state = isSessionActive(row.id) ? getTracker(row.id)?.state : undefined;
      return {
        ...row,
        processState: state?.processState ?? null,
        metaTask: state?.metaTask ?? 'Idle',
      };
    });
  });

  // REST: recent ANSI-stripped output tail for one terminal (serves /api/terminals/:id/output)
  app.get<{
    Params: { id: string };
    Querystring: { lines?: string };
  }>('/terminals/:id/output', async (request, reply) => {
    const { id } = request.params;

    if (!getDb().prepare('SELECT id FROM sessions WHERE id = ?').get(id)) {
      return reply.code(404).send({ error: 'Terminal not found' });
    }

    const lines = request.query.lines === undefined ? 200 : Number(request.query.lines);
    if (!Number.isSafeInteger(lines) || lines < 1 || lines > 2000) {
      return reply.code(400).send({ error: 'lines must be an integer between 1 and 2000' });
    }

    // Chunks can span multiple lines — read `lines` chunks, then cap by real lines.
    const text = strip(readRecentOutput(id, lines).join(''));
    return { output: text.split('\n').slice(-lines).join('\n') };
  });

  app.get<{
    Params: { sessionId: string };
    Querystring: { passive?: string; attempt?: string };
  }>('/terminal/:sessionId', { websocket: true }, (socket, req) => {
    const { sessionId } = req.params;
    const isPassive = req.query.passive === '1';
    const attempt = req.query.attempt || '?';

    // --- Per-session input authorization (additive / migration-safe) ---
    // Output/resize/refresh stay unauthenticated so existing read-only
    // clients are unaffected. Only `input` frames are gated, and only when
    // OCTOALLY_INPUT_TOKEN is configured. A socket becomes input-authed by
    // presenting a valid token via the `?inputToken=` query param at connect
    // OR an `{"type":"auth","token":"..."}` frame any time before sending
    // input. When input auth is disabled (no env) behaviour is unchanged.
    let inputAuthed = false;
    {
      const reqUrl = req.url || '';
      const qpMatch = /[?&]inputToken=([^&]+)/.exec(reqUrl);
      const qpToken = qpMatch ? decodeURIComponent(qpMatch[1]) : null;
      if (isInputTokenValid(qpToken, sessionId)) inputAuthed = true;
    }
    let inputDeniedNotified = false;
    // Returns true if this socket may write `input` to the PTY. Fail-OPEN
    // only when input auth is globally disabled (preserves the pre-change
    // contract for the live fleet); otherwise fail-CLOSED with a one-shot
    // client notice so dropped keystrokes are never silent.
    const inputAllowed = (): boolean => {
      if (!inputAuthEnabled()) return true; // disabled => legacy behaviour
      if (inputAuthed) return true;
      if (!inputDeniedNotified) {
        inputDeniedNotified = true;
        try {
          socket.send(JSON.stringify({
            type: 'input-denied',
            message: 'Input rejected: terminal socket not authorized to send keystrokes.',
          }));
        } catch { /* socket may be closing */ }
      }
      return false;
    };

    // Check if this is a pending session that needs to be spawned.
    // Use getPendingSpawn (peek) instead of consume — React StrictMode
    // double-mounts effects, so the first WebSocket may close immediately.
    // Only consume after successful spawn.
    const pending = getPendingSpawn(sessionId);
    if (pending) {
      let spawned = false;

      // If this WebSocket closes before spawning, do nothing — the pending
      // spawn stays in the map for the next connection to pick up.
      socket.on('close', () => {
        // nothing to clean up if not yet spawned
      });

      socket.on('message', async (raw: Buffer | string) => {
        try {
          const msg = JSON.parse(raw.toString());

          if (!spawned && msg.type === 'resize') {
            // Now consume — this connection will own the spawn
            const info = consumePendingSpawn(sessionId);
            if (!info) {
              // Another connection beat us — try normal attach
              const attached = attachTerminal(sessionId, socket);
              if (attached) { spawned = true; }
              return;
            }

            spawned = true;
            try {
              if (info.mode === 'adopt' && info.socketPath) {
                await spawnAdopt(sessionId, info.socketPath, info.projectPath, info.task, msg.cols, msg.rows);
              } else if (info.mode === 'terminal') {
                await spawnTerminal(sessionId, info.projectPath, msg.cols, msg.rows);
              } else if (info.mode === 'agent' && info.agentType) {
                await spawnAgent(sessionId, info.projectPath, info.task, info.agentType, msg.cols, msg.rows, info.cliType);
              } else {
                await spawnSession(sessionId, info.projectPath, info.task, msg.cols, msg.rows, info.cliType);
              }
              const attached = attachTerminal(sessionId, socket);
              if (!attached) {
                socket.send(JSON.stringify({ type: 'error', message: 'Failed to attach after spawn' }));
                socket.close();
              }
            } catch (err: any) {
              socket.send(JSON.stringify({ type: 'error', message: `Spawn failed: ${err.message}` }));
              socket.close();
            }
            return;
          }

          if (msg.type === 'auth') {
            if (isInputTokenValid(msg.token, sessionId)) {
              inputAuthed = true;
              socket.send(JSON.stringify({ type: 'auth-ok' }));
            } else {
              socket.send(JSON.stringify({ type: 'auth-failed' }));
            }
            return;
          }

          if (spawned) {
            switch (msg.type) {
              case 'input':
                if (inputAllowed()) writeToSession(sessionId, msg.data, msg.paste);
                break;
              case 'resize':
                resizeSession(sessionId, msg.cols, msg.rows);
                break;
            }
          }
        } catch {
          if (spawned && inputAllowed()) writeToSession(sessionId, raw.toString());
        }
      });

      socket.send(JSON.stringify({ type: 'connected', sessionId }));
      return;
    }

    // Normal flow: session already running.
    //
    // Passive connections (grid/thumbnail terminals): subscribe + replay
    // immediately — they never send resize so we can't wait for one.
    //
    // Active connections: don't subscribe yet. Wait for the browser to send
    // its resize so we can resize the tmux pane, wait for reflow, then send
    // a clean capture-pane snapshot. Only THEN subscribe for live output.
    // This prevents tmux resize-redraw garbage from reaching the client.

    // Both passive and active paths need async reconnect (worker fork),
    // so wrap in an async IIFE to handle awaiting properly.
    (async () => {
      if (isPassive) {
        let attached = attachTerminal(sessionId, socket);
        if (!attached) {
          await reconnectSession(sessionId);
          attached = attachTerminal(sessionId, socket);
        }
        if (!attached) {
          // Mark dead sessions as failed so they stop appearing in the grid
          getDb().prepare(`
            UPDATE sessions SET status = 'failed', completed_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND status IN ('running', 'detached')
          `).run(sessionId);
          socket.send(JSON.stringify({ type: 'error', message: 'Session not found or not running' }));
          socket.close();
          return;
        }
        // Passive terminals forward input and handle refresh
        socket.on('message', (raw: Buffer | string) => {
          try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'auth') {
              if (isInputTokenValid(msg.token, sessionId)) {
                inputAuthed = true;
                socket.send(JSON.stringify({ type: 'auth-ok' }));
              } else {
                socket.send(JSON.stringify({ type: 'auth-failed' }));
              }
            } else if (msg.type === 'input') {
              if (inputAllowed()) writeToSession(sessionId, msg.data, msg.paste);
            } else if (msg.type === 'refresh') {
              console.log(`[REFRESH] ${sessionId}: passive client requested capture-pane refresh`);
              sendReplay(sessionId, socket, true);
            }
          } catch { /* ignore */ }
        });
        const pingInterval = setInterval(() => {
          if (socket.readyState === 1) socket.ping();
          else clearInterval(pingInterval);
        }, 30_000);
        socket.on('close', () => clearInterval(pingInterval));

        socket.send(JSON.stringify({ type: 'connected', sessionId }));
        return;
      }

      // Active connection: subscribe + replay.
      let attached = attachTerminal(sessionId, socket);
      if (!attached) {
        await reconnectSession(sessionId);
        attached = attachTerminal(sessionId, socket);
      }
      if (!attached) {
        getDb().prepare(`
          UPDATE sessions SET status = 'failed', completed_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ? AND status IN ('running', 'detached')
        `).run(sessionId);
        socket.send(JSON.stringify({ type: 'error', message: 'Session not found or not running' }));
        socket.close();
        return;
      }

      // Handle incoming messages from the browser terminal
      socket.on('message', (raw: Buffer | string) => {
        try {
          const msg = JSON.parse(raw.toString());

          switch (msg.type) {
            case 'auth':
              if (isInputTokenValid(msg.token, sessionId)) {
                inputAuthed = true;
                socket.send(JSON.stringify({ type: 'auth-ok' }));
              } else {
                socket.send(JSON.stringify({ type: 'auth-failed' }));
              }
              break;

            case 'input':
              if (inputAllowed()) writeToSession(sessionId, msg.data, msg.paste);
              break;

            case 'resize':
              resizeSession(sessionId, msg.cols, msg.rows);
              break;

            case 'refresh':
              // Client requested a fresh display — use tmux capture-pane
              // to get the current visual state (like adopt does).
              // This fixes Codex rendering issues without pop-out/re-adopt.
              console.log(`[REFRESH] ${sessionId}: client requested capture-pane refresh`);
              sendReplay(sessionId, socket, true);
              break;
          }
        } catch {
          if (inputAllowed()) writeToSession(sessionId, raw.toString());
        }
      });

      // Keep-alive ping every 30s to prevent Tailscale Funnel (and other
      // reverse proxies) from dropping idle WebSocket connections.
      const pingInterval = setInterval(() => {
        if (socket.readyState === 1 /* OPEN */) socket.ping();
        else clearInterval(pingInterval);
      }, 30_000);
      socket.on('close', () => clearInterval(pingInterval));

      socket.send(JSON.stringify({ type: 'connected', sessionId }));
    })().catch((err) => {
      console.error(`[WS] Error in terminal handler for ${sessionId}:`, err);
      try {
        socket.send(JSON.stringify({ type: 'error', message: 'Internal error' }));
        socket.close();
      } catch { /* ignore */ }
    });
  });
};
