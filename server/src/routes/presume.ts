import { FastifyPluginAsync } from 'fastify';
import { execFile } from 'child_process';
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PRESUME_PY = '/home/hemang/aletheia-state/presume.py';
const FRAMES_JSONL = '/home/hemang/aletheia-state/state/frames.jsonl';
const ACT_NOTIFY = '/home/hemang/scripts/act-notify.sh';
const LOG_DIR = '/home/hemang/aletheia-state/logs';
const PRESUME_LOG = join(LOG_DIR, 'presume-octoally.log');
const MAX_IDEA_CHARS = 2000;
const MAX_PENDING = 25;

// --- Trust keystone (Loop 1): prompt-injection gate -------------------------
// Reject hostile inputs BEFORE presume.py (and downstream ask.sh -> LLM) ever
// sees them. The idea is never shell-interpolated, but these patterns are the
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

// Serialize background presume runs: concurrent presume.py invocations produced
// an intermittent non-zero exit (claude-CLI contention, observed 2026-06-11
// emulator E2E — one of two simultaneous runs failed, idea silently dropped).
// Ambient idea mode emits utterances seconds apart, so overlap is the normal
// case, not the edge. Runs execute one at a time in arrival order.
let pendingCount = 0;
let presumeChain: Promise<void> = Promise.resolve();

function appendLog(line: string) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(PRESUME_LOG, line + '\n');
  } catch { /* non-fatal */ }
}

// "Jarvis heard you" — fire a Telegram confirmation to Hemang after a frame is
// written. Reuses scripts/act-notify.sh (sops token + chat_id already wired,
// adversarial-safe via --data-urlencode). Independent of n8n. Fire-and-forget:
// a notify failure must NEVER fail the presume run, but it IS logged (no dark
// failure — Verification-on-Ship: a failed send emits a .notify_failed log).
function notifyFrameCaptured(ideaRaw: string, confidence: number | null, ts: string) {
  const conf = (typeof confidence === 'number' && !Number.isNaN(confidence))
    ? confidence.toFixed(2) : '?';
  const ideaShort = ideaRaw.length > 140 ? ideaRaw.slice(0, 137) + '…' : ideaRaw;
  const msg = `🧠 Idea captured: ${ideaShort} (conf ${conf})`;
  // act-notify.sh "<message>" — message passed as a single argv (never shell-split).
  execFile('bash', [ACT_NOTIFY, msg], { timeout: 15_000 }, (err, _stdout, stderr) => {
    if (err) {
      appendLog(`[${ts}] .notify_failed err=${(err.message || '').slice(0, 120)} stderr=${(stderr || '').trim().slice(0, 120)}`);
    } else {
      appendLog(`[${ts}] .notify_sent idea=${ideaShort.slice(0, 60)} conf=${conf}`);
    }
  });
}

// Pull the confidence + idea_raw of the just-written frame. presume.py prints
// the full frame JSON to stdout; if that parse fails (e.g. degrade noise), fall
// back to the tail of frames.jsonl. Defensive — confidence is "nice to have",
// the Telegram still sends with conf '?' if both fail.
function frameConfidence(stdout: string): number | null {
  try {
    const start = stdout.indexOf('{');
    const end = stdout.lastIndexOf('}');
    if (start !== -1 && end > start) {
      const obj = JSON.parse(stdout.slice(start, end + 1));
      if (obj && typeof obj.confidence === 'number') return obj.confidence;
    }
  } catch { /* fall through to file tail */ }
  try {
    if (existsSync(FRAMES_JSONL)) {
      const lines = readFileSync(FRAMES_JSONL, 'utf-8').split('\n').filter((l) => l.trim());
      if (lines.length) {
        const obj = JSON.parse(lines[lines.length - 1]);
        if (obj && typeof obj.confidence === 'number') return obj.confidence;
      }
    }
  } catch { /* give up — return null, notify with conf '?' */ }
  return null;
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

    // Trust keystone: prompt-injection gate — reject BEFORE presume.py runs.
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

    // Background execution — no shell, args array. 300s timeout: presume.py's
    // internal ask.sh budget is 250s; the outer timeout must outlive it so the
    // heuristic-degrade frame still gets written on slow LLM runs.
    if (pendingCount >= MAX_PENDING) {
      appendLog(`[${ts}] .dropped idea=${idea.slice(0, 80)} err=queue full (${MAX_PENDING} pending)`);
      return;
    }
    pendingCount++;
    presumeChain = presumeChain.then(() => new Promise<void>((resolve) => {
      execFile(
        'python3',
        [PRESUME_PY, '--device-id', deviceId, idea],
        { timeout: 300_000, maxBuffer: 4 * 1024 * 1024 },
        (err, stdout) => {
          pendingCount--;
          if (err) {
            appendLog(`[${ts}] .failed idea=${idea.slice(0, 80)} err=${err.message}`);
          } else {
            appendLog(`[${ts}] .ok idea=${idea.slice(0, 80)}`);
            // Frame written -> "Jarvis heard you" confirmation to Hemang.
            notifyFrameCaptured(idea, frameConfidence(stdout || ''), ts);
          }
          resolve();
        }
      );
    }));
  });
};
