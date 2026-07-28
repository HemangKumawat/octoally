import { FastifyPluginAsync } from 'fastify';
import { execFile } from 'child_process';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const RELAY_PY = '/home/hemang/ALETHEIA-NEXUS/scripts/nexus-relay.py';
const LOG_DIR = '/home/hemang/aletheia-state/logs';
const PRESUME_LOG = join(LOG_DIR, 'presume-octoally.log');
const MAX_IDEA_CHARS = 2000;

// --- Trust keystone (Loop 1): prompt-injection gate -------------------------
// Reject hostile inputs BEFORE the nexus queue (and the tool-armed executor
// downstream) ever sees them. Never shell-interpolated, but these patterns are the
// classic prompt-injection / destructive-intent fingerprints that must not be
// laundered into an LLM presumption (enochko/jarvis pattern). 400 on match.
const INJECTION_PATTERNS: { name: string; re: RegExp }[] = [
  // Catches "ignore previous instructions", "ignore all previous instructions",
  // "ignore the above instructions", "disregard all prior instructions", etc. —
  // up to two filler words (the/all/any/your/my/these) between the verb and the
  // qualifier, and between the qualifier and "instructions".
  { name: 'ignore-instructions', re: /(?:ignore|disregard|forget)\s+(?:(?:the|all|any|your|my|these)\s+){0,2}(?:previous|prior|above|earlier|all)\s+(?:(?:the|those|these)\s+){0,1}instructions?/i },
  { name: 'disregard', re: /\bdisregard\b/i },
  { name: 'system-prompt', re: /system\s*prompt/i },
  { name: 'rm-rf', re: /rm\s+-rf\b/i },
  { name: 'sudo', re: /\bsudo\b/i },
  { name: 'exfiltrate', re: /exfiltrat/i },
];

function detectInjection(text: string): string | null {
  for (const p of INJECTION_PATTERNS) {
    if (p.re.test(text)) return p.name;
  }
  return null;
}

function appendLog(line: string) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(PRESUME_LOG, line + '\n');
  } catch { /* non-fatal */ }
}

export const presumeRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { idea?: unknown; device_id?: unknown } }>('/presume', async (req, reply) => {
    const raw = (req.body as any)?.idea;
    if (!raw || typeof raw !== 'string') {
      return reply.status(400).send({ ok: false, error: 'idea must be a non-empty string' });
    }

    // Sanitize: cap length, strip control chars — never passed via shell string
    const idea = raw.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, MAX_IDEA_CHARS);
    if (!idea) {
      return reply.status(400).send({ ok: false, error: 'idea was empty after sanitization' });
    }

    // Trust keystone: prompt-injection gate — reject BEFORE it enters the queue.
    const ts = new Date().toISOString();
    const hit = detectInjection(idea);
    if (hit) {
      appendLog(`[${ts}] .rejected pattern=${hit} idea=${idea.slice(0, 80)}`);
      return reply.status(400).send({ ok: false, error: 'idea rejected by injection gate', pattern: hit });
    }

    // device_id: trust-keystone field — which device emitted this idea. From the
    // POST body when present (app-side population deferred to next app rebuild),
    // else "unknown". Coerced to a clean string; never shell-interpolated.
    const rawDevice = (req.body as any)?.device_id;
    const deviceId = (typeof rawDevice === 'string' && rawDevice.trim())
      ? rawDevice.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 128)
      : 'unknown';

    // Fire-and-forget: respond immediately, run presume in background
    reply.status(200).send({ ok: true, queued: true, ts, device_id: deviceId });

    // Ingest into the SAME queue Telegram uses (#99348). Was: exec presume.py,
    // which ran an LLM per utterance, serialized behind a chain — it hung past
    // its 300s timeout and frames.jsonl went dead on 2026-06-14 while this route
    // kept answering {queued:true}. The decoder + executor already do framing,
    // acking and execution; a capture only has to be an append. No shell, args
    // array, 20s cap — the call is a single file append.
    execFile(
      'python3',
      [RELAY_PY, '--capture', idea, '--source', `voice:${deviceId}`],
      { timeout: 20_000, maxBuffer: 1024 * 1024, env: { ...process.env, HOME: '/home/hemang' } },
      (err, stdout, stderr) => {
        if (err) {
          appendLog(`[${ts}] .failed idea=${idea.slice(0, 80)} err=${err.message} stderr=${(stderr || '').trim().slice(0, 160)}`);
        } else {
          appendLog(`[${ts}] .ok id=${(stdout || '').trim()} idea=${idea.slice(0, 80)}`);
        }
      }
    );
  });
};
