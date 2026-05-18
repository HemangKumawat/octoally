import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Per-session input authorization for the terminal WebSocket.
 *
 * DESIGN GOAL (additive / migration-safe): this gates ONLY inbound
 * `{"type":"input"}` frames on the PTY socket. Output/render, `resize`,
 * `refresh`, and the WebSocket upgrade itself are left completely untouched,
 * so existing read-only clients (the :42010 dashboard, older phone builds,
 * term-mirror) keep working exactly as before — they simply cannot inject
 * keystrokes into a real shell. This is deliberately decoupled from
 * `config.authToken` (the all-or-nothing route-level Bearer hook) so that
 * enabling input auth does NOT break the unauthenticated live fleet.
 *
 * Token model:
 *  - `OCTOALLY_INPUT_TOKEN` env = the master input secret.
 *  - A client may present the master token (full scope, any session) OR a
 *    per-session derived token `HMAC-SHA256(master, sessionId)` (hex), which
 *    only authorizes input to that one session. A derived token for session A
 *    cannot write to session B.
 *  - If `OCTOALLY_INPUT_TOKEN` is unset, input auth is DISABLED and behaviour
 *    is identical to before this change (fail-open by config, never silently
 *    fail-closed — a closed gate with no token would brick every client).
 */

// Read lazily (not at module load) so it does not matter whether this module
// is imported before or after `config.ts` runs `dotenv.config()`.
function rawSecret(): string {
  return process.env.OCTOALLY_INPUT_TOKEN || '';
}

/** True when input authorization is active (the env secret is configured). */
export function inputAuthEnabled(): boolean {
  return rawSecret().length > 0;
}

/** Constant-time string compare that tolerates length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Still run a compare to keep timing roughly constant, then return false.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/**
 * Derive the per-session scoped token for a session id.
 * Exposed so a controlled client / test harness can mint a scoped token.
 */
export function deriveSessionToken(sessionId: string): string {
  return createHmac('sha256', rawSecret()).update(sessionId).digest('hex');
}

/**
 * Validate a presented token for a specific session.
 * Accepts either the master token (full scope) or the session-scoped
 * derived token. Returns false when input auth is disabled — callers must
 * check `inputAuthEnabled()` first to decide fail-open vs enforce.
 */
export function isInputTokenValid(token: string | undefined | null, sessionId: string): boolean {
  if (!inputAuthEnabled()) return false;
  if (!token || typeof token !== 'string') return false;
  if (safeEqual(token, rawSecret())) return true; // master = full scope
  return safeEqual(token, deriveSessionToken(sessionId)); // session-scoped
}
