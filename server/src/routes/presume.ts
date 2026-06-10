import { FastifyPluginAsync } from 'fastify';
import { execFile } from 'child_process';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PRESUME_PY = '/home/hemang/aletheia-state/presume.py';
const LOG_DIR = '/home/hemang/aletheia-state/logs';
const PRESUME_LOG = join(LOG_DIR, 'presume-octoally.log');
const MAX_IDEA_CHARS = 2000;

function appendLog(line: string) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(PRESUME_LOG, line + '\n');
  } catch { /* non-fatal */ }
}

export const presumeRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { idea?: unknown } }>('/presume', async (req, reply) => {
    const raw = (req.body as any)?.idea;
    if (!raw || typeof raw !== 'string') {
      return reply.status(400).send({ ok: false, error: 'idea must be a non-empty string' });
    }

    // Sanitize: cap length, strip control chars — never passed via shell string
    const idea = raw.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, MAX_IDEA_CHARS);
    if (!idea) {
      return reply.status(400).send({ ok: false, error: 'idea was empty after sanitization' });
    }

    const ts = new Date().toISOString();

    // Fire-and-forget: respond immediately, run presume in background
    reply.status(200).send({ ok: true, queued: true, ts });

    // Background execution — no shell, args array, 120s timeout (ask.sh→Opus can be slow)
    execFile(
      'python3',
      [PRESUME_PY, idea],
      { timeout: 120_000 },
      (err, stdout, stderr) => {
        if (err) {
          appendLog(`[${ts}] .failed idea=${idea.slice(0, 80)} err=${err.message}`);
        } else {
          appendLog(`[${ts}] .ok idea=${idea.slice(0, 80)}`);
        }
      }
    );
  });
};
