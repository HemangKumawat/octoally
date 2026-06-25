import { FastifyPluginAsync } from 'fastify';
import { readFileSync, existsSync, writeFileSync, renameSync, appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { execFile } from 'child_process';
import { scaffoldProject, ScaffoldInput } from '../services/scaffold.js';

// Trust keystone (Loop 1): read-side of the presume frames event log.
// GET /api/frames -> newest-first, paginated. The operator SEES every idea the
// voice app presumed and its trust status BEFORE anything ever acts on it.
//
// Loop 2 (operator review surface): PUT /api/frames/:id/status -> the operator
// APPROVES / DISMISSES / EDITS a presumed idea. Two effects, both on disk:
//   1. The frame's `status` (and any `edited_fields`) is updated IN PLACE in
//      frames.jsonl, so the read-side reflects the operator's decision.
//   2. A record is appended to frame-feedback.jsonl — the revealed-preference
//      log the model-of-Hemang will later learn from (what he approves vs
//      dismisses vs hand-edits). Zero auto-execution: a status flip never
//      triggers a scaffold/act; it is purely the operator's recorded judgement.
const FRAMES_JSONL = '/home/hemang/aletheia-state/state/frames.jsonl';
const FEEDBACK_JSONL = '/home/hemang/aletheia-state/state/frame-feedback.jsonl';
// Loop 3 (keystone): execution audit log + the act-notify path (reuses the
// already-wired sops token + chat_id, adversarial-safe via --data-urlencode).
const ACTIONS_JSONL = '/home/hemang/aletheia-state/state/actions.jsonl';
const ACT_NOTIFY = '/home/hemang/scripts/act-notify.sh';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;
const VALID_STATUSES = new Set(['pending', 'approved', 'dismissed', 'acted']);

// Operator-editable presumption fields. Loop 2 ships title editing; the schema
// allows the small set of human-meaningful fields so the model-of-Hemang can
// learn from corrections without us re-touching this allowlist per UI button.
// Anything outside this set is rejected (never blindly merged into the frame).
const EDITABLE_FIELDS = new Set(['title', 'one_line', 'idea_normalized']);
const MAX_EDIT_CHARS = 2000;

interface FrameSummary {
  id: string;
  captured_at: string;
  idea_raw: string;
  status: string;
  device_id: string;
  confidence: number | null;
}

// Back-compat reader: frames written before the trust-keystone fields existed
// lack `status`/`device_id`. A missing status is treated as "pending" (nothing
// has been acted on); a missing device_id is "unknown".
function toSummary(obj: any): FrameSummary | null {
  if (!obj || typeof obj !== 'object') return null;
  const id = typeof obj.frame_id === 'string' ? obj.frame_id : null;
  if (!id) return null;
  let status = typeof obj.status === 'string' ? obj.status : 'pending';
  if (!VALID_STATUSES.has(status)) status = 'pending';
  return {
    id,
    captured_at: typeof obj.captured_at === 'string' ? obj.captured_at : '',
    idea_raw: typeof obj.idea_raw === 'string' ? obj.idea_raw : (obj.idea_normalized || ''),
    status,
    device_id: typeof obj.device_id === 'string' && obj.device_id ? obj.device_id : 'unknown',
    confidence: typeof obj.confidence === 'number' ? obj.confidence : null,
  };
}

// Sanitize an operator-supplied edit value: strip control chars, cap length.
// Never shell-interpolated, but we keep the log clean and bounded.
function cleanEdit(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, MAX_EDIT_CHARS);
  return s.length ? s : null;
}

// Loop 3: locate the FULL frame object (not the read-summary) by id, walking
// from the tail. Returns { index, obj, lines } or null. Reused by the scaffold
// endpoint, which needs `presumed` + `status` and must rewrite the line.
function loadFrameById(frameId: string): { index: number; obj: any; lines: string[] } | null {
  if (!existsSync(FRAMES_JSONL)) return null;
  let lines: string[];
  try {
    lines = readFileSync(FRAMES_JSONL, 'utf-8').split('\n');
  } catch {
    return null;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.trim()) continue;
    let obj: any;
    try { obj = JSON.parse(line); } catch { continue; }
    if (obj && obj.frame_id === frameId) return { index: i, obj, lines };
  }
  return null;
}

// Summarize presumed.stack (an array whose entries are dict-ish strings) into a
// short free-text framework label for the CLAUDE.md/README stub. Best-effort:
// the stub is documentation, not load-bearing — we never fail scaffold on this.
function summarizeFramework(presumed: any): string | null {
  if (!presumed || typeof presumed !== 'object') return null;
  const stack = presumed.stack;
  if (Array.isArray(stack) && stack.length) {
    const joined = stack.map((s) => (typeof s === 'string' ? s : JSON.stringify(s))).join(' ');
    return joined.slice(0, 600);
  }
  if (typeof stack === 'string' && stack.trim()) return stack.slice(0, 600);
  return null;
}

// Fire the keystone Telegram via the act-notify path. Fire-and-forget — a
// notify failure must NEVER fail an already-successful scaffold, but act-notify
// itself emits a .notify_failed event (no dark failure). message is a single
// argv (never shell-split), adversarial-safe inside act-notify.sh.
function notifyScaffolded(slug: string, path: string): void {
  const msg = `🏗️ Scaffolded ${slug} at ${path}`;
  execFile('bash', [ACT_NOTIFY, msg], { timeout: 15_000 }, () => { /* fire-and-forget */ });
}

export const framesRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { limit?: string; status?: string } }>('/frames', async (req, reply) => {
    // limit: default 20, clamp 1..200.
    let limit = DEFAULT_LIMIT;
    const rawLimit = (req.query as any)?.limit;
    if (rawLimit !== undefined) {
      const n = parseInt(String(rawLimit), 10);
      if (!Number.isNaN(n)) limit = Math.max(1, Math.min(MAX_LIMIT, n));
    }
    // optional status filter (pending|approved|dismissed|acted).
    const rawStatus = (req.query as any)?.status;
    const statusFilter = (typeof rawStatus === 'string' && VALID_STATUSES.has(rawStatus))
      ? rawStatus : null;

    if (!existsSync(FRAMES_JSONL)) {
      return reply.send({ ok: true, count: 0, total: 0, frames: [] });
    }

    let lines: string[];
    try {
      lines = readFileSync(FRAMES_JSONL, 'utf-8').split('\n').filter((l) => l.trim());
    } catch (e: any) {
      return reply.status(500).send({ ok: false, error: 'failed to read frames log' });
    }

    // Parse newest-first. Walk from the tail; skip malformed lines (never throw
    // a 500 on one bad line). Stop once we have `limit` matching summaries.
    const frames: FrameSummary[] = [];
    let total = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      let obj: any;
      try { obj = JSON.parse(lines[i]); } catch { continue; }
      const s = toSummary(obj);
      if (!s) continue;
      if (statusFilter && s.status !== statusFilter) continue;
      total++;
      if (frames.length < limit) frames.push(s);
    }

    return reply.send({ ok: true, count: frames.length, total, frames });
  });

  // --- Loop 2: operator review surface -------------------------------------
  // PUT /api/frames/:id/status
  // body: { status: approved|dismissed|acted, edited_fields?: { title?, one_line?, idea_normalized? } }
  // Effects: (1) update that frame's status (+ edits) in frames.jsonl in place;
  //          (2) append a revealed-preference record to frame-feedback.jsonl.
  // NEVER auto-executes anything — purely records the operator's judgement.
  app.put<{
    Params: { id: string };
    Body: { status?: unknown; edited_fields?: unknown };
  }>('/frames/:id/status', async (req, reply) => {
    const frameId = req.params.id;
    if (!frameId || typeof frameId !== 'string') {
      return reply.status(400).send({ ok: false, error: 'frame id required' });
    }

    const body = (req.body || {}) as { status?: unknown; edited_fields?: unknown };
    const status = typeof body.status === 'string' ? body.status : '';
    // 'pending' is a valid stored status but not a valid *operator action* — the
    // operator can only move a frame forward (approved/dismissed/acted), never
    // back to pending via this endpoint.
    if (status !== 'approved' && status !== 'dismissed' && status !== 'acted') {
      return reply.status(400).send({
        ok: false,
        error: 'status must be one of: approved, dismissed, acted',
      });
    }

    // Validate + sanitize edited_fields against the allowlist. Reject unknown
    // keys outright rather than silently dropping them (operator should know
    // their edit was not applied).
    const editedFields: Record<string, string> = {};
    if (body.edited_fields !== undefined && body.edited_fields !== null) {
      if (typeof body.edited_fields !== 'object' || Array.isArray(body.edited_fields)) {
        return reply.status(400).send({ ok: false, error: 'edited_fields must be an object' });
      }
      for (const [k, v] of Object.entries(body.edited_fields as Record<string, unknown>)) {
        if (!EDITABLE_FIELDS.has(k)) {
          return reply.status(400).send({
            ok: false,
            error: `field '${k}' not editable; allowed: ${[...EDITABLE_FIELDS].join(', ')}`,
          });
        }
        const cleaned = cleanEdit(v);
        if (cleaned === null) {
          return reply.status(400).send({ ok: false, error: `field '${k}' must be a non-empty string` });
        }
        editedFields[k] = cleaned;
      }
    }

    if (!existsSync(FRAMES_JSONL)) {
      return reply.status(404).send({ ok: false, error: 'frames log not found' });
    }

    let lines: string[];
    try {
      lines = readFileSync(FRAMES_JSONL, 'utf-8').split('\n');
    } catch {
      return reply.status(500).send({ ok: false, error: 'failed to read frames log' });
    }

    // Find the target frame by frame_id. Walk from the tail (newest match wins
    // if the id somehow appears twice). Skip malformed lines without throwing.
    let targetIndex = -1;
    let targetObj: any = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line.trim()) continue;
      let obj: any;
      try { obj = JSON.parse(line); } catch { continue; }
      if (obj && obj.frame_id === frameId) {
        targetIndex = i;
        targetObj = obj;
        break;
      }
    }

    if (targetIndex === -1 || !targetObj) {
      return reply.status(404).send({ ok: false, error: `frame '${frameId}' not found` });
    }

    const ts = new Date().toISOString();
    const prevStatus = typeof targetObj.status === 'string' ? targetObj.status : 'pending';

    // Apply the status + edits in place. edited_fields are written to the top
    // level of the frame AND mirrored into `presumed` if that object exists, so
    // the read-side (which surfaces idea_raw/title) reflects the correction.
    targetObj.status = status;
    targetObj.status_updated_at = ts;
    if (Object.keys(editedFields).length > 0) {
      for (const [k, v] of Object.entries(editedFields)) {
        targetObj[k] = v;
        if (targetObj.presumed && typeof targetObj.presumed === 'object' && !Array.isArray(targetObj.presumed)) {
          targetObj.presumed[k] = v;
        }
      }
    }

    lines[targetIndex] = JSON.stringify(targetObj);

    // Atomic write: tmp file + rename, so a crash mid-write never truncates the
    // frames log (the source of truth for every other reader).
    const tmpPath = `${FRAMES_JSONL}.tmp-${process.pid}-${Date.now()}`;
    try {
      writeFileSync(tmpPath, lines.join('\n'), 'utf-8');
      renameSync(tmpPath, FRAMES_JSONL);
    } catch (e: any) {
      return reply.status(500).send({ ok: false, error: 'failed to persist frame status' });
    }

    // Append the revealed-preference record. This is the learning signal; a
    // failure here is logged via the thrown error (no dark failure) but the
    // status flip already succeeded, so we report partial success rather than
    // pretend the whole op failed.
    let feedbackOk = true;
    try {
      mkdirSync(dirname(FEEDBACK_JSONL), { recursive: true });
      const record = {
        frame_id: frameId,
        action: status,
        prev_status: prevStatus,
        edited_fields: editedFields,
        ts,
      };
      appendFileSync(FEEDBACK_JSONL, JSON.stringify(record) + '\n', 'utf-8');
    } catch {
      feedbackOk = false;
    }

    return reply.send({
      ok: true,
      frame_id: frameId,
      status,
      edited_fields: editedFields,
      feedback_logged: feedbackOk,
      ts,
    });
  });

  // --- Loop 3: KEYSTONE — frame -> scaffold (first real Jarvis action) -------
  // POST /api/frames/:id/scaffold
  // The ONLY endpoint in the system that WRITES to the filesystem from a voice
  // idea. Hard-gated: fires ONLY when the frame's status === 'approved' (the
  // human-in-the-loop gate). NEVER on pending/dismissed/acted. Effects on
  // success: create /home/hemang/<slug>/ (new top-level dir only) + local
  // `git init` + minimal CLAUDE.md/README -> append actions.jsonl -> flip the
  // frame status to 'acted' -> Telegram Hemang. Idempotent: a re-POST after the
  // status is 'acted' is refused by the gate (not 'approved' anymore), and the
  // scaffold module itself refuses if the target dir already exists.
  app.post<{ Params: { id: string } }>('/frames/:id/scaffold', async (req, reply) => {
    const frameId = req.params.id;
    if (!frameId || typeof frameId !== 'string') {
      return reply.status(400).send({ ok: false, error: 'frame id required' });
    }

    const found = loadFrameById(frameId);
    if (!found) {
      return reply.status(404).send({ ok: false, error: `frame '${frameId}' not found` });
    }
    const { index, obj, lines } = found;

    // THE GATE. A frame scaffolds ONLY if a human approved it. Any other status
    // (pending / dismissed / acted / missing) is refused with 409 and ZERO side
    // effects — nothing on disk is touched on a gate refusal.
    const frameStatus = typeof obj.status === 'string' ? obj.status : 'pending';
    if (frameStatus !== 'approved') {
      return reply.status(409).send({
        ok: false,
        error: `frame status is '${frameStatus}'; scaffold requires 'approved'`,
        frame_id: frameId,
        status: frameStatus,
      });
    }

    // Assemble the sandboxed scaffold input from the presumption. The scaffold
    // module owns slug-sanitization, the path fence, and refuse-if-exists.
    const presumed = (obj.presumed && typeof obj.presumed === 'object') ? obj.presumed : {};
    const input: ScaffoldInput = {
      frameId,
      title: typeof presumed.title === 'string' ? presumed.title : null,
      home: typeof presumed.home === 'string' ? presumed.home : null,
      ideaRaw: typeof obj.idea_raw === 'string' ? obj.idea_raw : (obj.idea_normalized || null),
      oneLine: typeof presumed.one_line === 'string' ? presumed.one_line : null,
      projectKind: typeof presumed.project_kind === 'string' ? presumed.project_kind : null,
      framework: summarizeFramework(presumed),
    };

    const outcome = await scaffoldProject(input);
    const ts = new Date().toISOString();

    // Audit FIRST (both success and refusal) — actions.jsonl is the execution
    // log; an honest record of a refused attempt is as valuable as a success.
    // A logging failure is surfaced (no dark failure) but never silently eaten.
    let auditOk = true;
    try {
      mkdirSync(dirname(ACTIONS_JSONL), { recursive: true });
      const record = {
        frame_id: frameId,
        action: 'scaffold',
        path: outcome.ok ? outcome.path : (outcome.path || null),
        slug: outcome.ok ? outcome.slug : (outcome.slug || null),
        ts,
        outcome: outcome.ok ? 'success' : `refused:${outcome.code}`,
      };
      appendFileSync(ACTIONS_JSONL, JSON.stringify(record) + '\n', 'utf-8');
    } catch {
      auditOk = false;
    }

    if (!outcome.ok) {
      // Sandbox refusal (unsafe-path / exists / invalid-slug / etc). No status
      // flip, no Telegram — nothing happened on disk. 422 = the approved frame
      // was understood but its scaffold could not proceed safely.
      return reply.status(422).send({
        ok: false,
        error: outcome.error,
        code: outcome.code,
        frame_id: frameId,
        slug: outcome.slug,
        path: outcome.path,
        audit_logged: auditOk,
      });
    }

    // Success: flip the frame status to 'acted' in place (atomic tmp+rename, so
    // a crash never truncates the frames log). A flip failure does NOT undo the
    // scaffold (dir already exists) — we report status_updated:false honestly.
    let statusUpdated = true;
    obj.status = 'acted';
    obj.status_updated_at = ts;
    obj.scaffolded_at = ts;
    obj.scaffold_path = outcome.path;
    lines[index] = JSON.stringify(obj);
    const tmpPath = `${FRAMES_JSONL}.tmp-${process.pid}-${Date.now()}`;
    try {
      writeFileSync(tmpPath, lines.join('\n'), 'utf-8');
      renameSync(tmpPath, FRAMES_JSONL);
    } catch {
      statusUpdated = false;
    }

    // Telegram Hemang via the act-notify path. Fire-and-forget.
    notifyScaffolded(outcome.slug, outcome.path);

    return reply.send({
      ok: true,
      frame_id: frameId,
      status: 'acted',
      status_updated: statusUpdated,
      slug: outcome.slug,
      path: outcome.path,
      created: outcome.created,
      audit_logged: auditOk,
      ts,
    });
  });
};
