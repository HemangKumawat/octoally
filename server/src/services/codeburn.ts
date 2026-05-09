// server/src/services/codeburn.ts

import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { mkdir, readFile, writeFile, stat, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';

const execFile = promisify(execFileCb);

// ── Resolved at startup ──────────────────────────────────────────────────
const CODEBURN_BIN = '/home/hemang/.npm-global/bin/codeburn';
const CACHE_DIR = join(homedir(), '.cache', 'codeburn-dash');
const SPAWN_TIMEOUT_MS = 60_000;
const MAX_BUFFER = 10 * 1024 * 1024;

// ── JSON shapes (verbatim from real codeburn 0.9.7 output) ───────────────

export interface CodeburnTokens {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface CodeburnOverview {
  cost: number;
  calls: number;
  sessions: number;
  cacheHitPercent: number;
  tokens: CodeburnTokens;
}

export interface CodeburnDaily {
  date: string;            // YYYY-MM-DD
  cost: number;
  calls: number;
}

export interface CodeburnProject {
  name: string;            // e.g. "-home-hemang-ALETHEIA-NEXUS"  (use as API key)
  path: string;            // e.g. "/home/hemang/ALETHEIA-NEXUS"  (use for display via basename)
  cost: number;
  avgCostPerSession: number;
  calls: number;
  sessions: number;
}

export interface CodeburnActivity {
  category: string;        // "Coding"|"Debugging"|"Testing"|"Delegation"|"Exploration"|...
  cost: number;
  turns: number;
  editTurns: number;
  oneShotTurns: number;
  oneShotRate: number | null;
}

export interface CodeburnModel {
  name: string;            // "Opus 4.7" | "Sonnet 4.6" | "Haiku 4.5" | "Gemini 2.5 Pro" | ...
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cost: number;
  editTurns: number;
  oneShotTurns: number;
  oneShotRate: number | null;
  retriesPerEdit: number | null;
  costPerEdit: number | null;
}

export interface CodeburnTool       { name: string; calls: number; }
export interface CodeburnMcpServer  { name: string; calls: number; }
export interface CodeburnShellCmd   { name: string; calls: number; }

export interface CodeburnTopSession {
  project: string;
  sessionId: string;
  date: string;
  cost: number;
  calls: number;
}

export interface CodeburnReport {
  generated: string;       // ISO timestamp
  currency: string;        // "USD"
  period: string;          // "Last 7 Days" | "Today" | ...
  periodKey: string;       // "week" | "today" | "30days" | "month" | "all"
  overview: CodeburnOverview;
  daily: CodeburnDaily[];
  projects: CodeburnProject[];
  activities: CodeburnActivity[];
  models: CodeburnModel[];
  tools: CodeburnTool[];
  mcpServers: CodeburnMcpServer[];
  shellCommands: CodeburnShellCmd[];
  topSessions: CodeburnTopSession[];
  // unknown future fields preserved as pass-through; consumers tolerate extras
  [k: string]: unknown;
}

export interface CodeburnStatus {
  currency: string;
  today: { cost: number; calls: number };
  month: { cost: number; calls: number };
}

export interface CodeburnMenubar {
  generated: string;
  current: {
    label: string;
    cost: number;
    calls: number;
    sessions: number;
    oneShotRate: number;
    inputTokens: number;
    outputTokens: number;
    cacheHitPercent: number;
    topActivities: Array<{ name: string; cost: number; turns: number; oneShotRate: number | null }>;
    topModels: Array<{ name: string; cost: number; calls: number }>;
    providers: Record<string, number>;
  };
  optimize: { findingCount: number; savingsUSD: number; topFindings: unknown[] };
  history: { daily: Array<Record<string, unknown>> };
}

// ── Result envelope ──────────────────────────────────────────────────────

export type CodeburnResult<T> =
  | { ok: true; data: T; cachedAt: number; fromCache: boolean }
  | { ok: false; code: string; stderr: string; lastGood: T | null };

// ── Adapter state ────────────────────────────────────────────────────────

const inFlight = new Map<string, Promise<CodeburnResult<unknown>>>();

let _binChecked = false;
let _binAvailable = false;

// Codeburn --version stamp, captured once at startup; participates in cache key
// so a `npm i -g codeburn@<newer>` automatically invalidates all cached entries.
let _codeburnVersion: string | null = null;
async function getCodeburnVersion(): Promise<string> {
  if (_codeburnVersion !== null) return _codeburnVersion;
  try {
    const { stdout } = await execFile(CODEBURN_BIN, ['--version'], {
      timeout: 5_000, env: { ...process.env, NO_COLOR: '1' },
    });
    _codeburnVersion = (stdout || '').trim() || 'unknown';
  } catch {
    _codeburnVersion = 'unknown';
  }
  return _codeburnVersion;
}

async function ensureCacheDir(): Promise<void> {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true, mode: 0o775 });
  }
}

async function checkBinary(): Promise<boolean> {
  if (_binChecked) return _binAvailable;
  _binChecked = true;
  try {
    await stat(CODEBURN_BIN);
    _binAvailable = true;
  } catch { _binAvailable = false; }
  return _binAvailable;
}

function keyFor(cmd: string, args: string[], version: string): string {
  const h = createHash('sha1');
  h.update(version);          // stamp version → cache invalidates on upgrade
  h.update('\x1f');
  h.update(cmd);
  for (const a of args) h.update('\x1f' + a);
  return h.digest('hex').slice(0, 16);
}

interface CacheMeta { ttlMs: number; cachedAt: number; generated?: string; }

async function readCache<T>(key: string): Promise<{ data: T; cachedAt: number } | null> {
  try {
    const data = JSON.parse(await readFile(join(CACHE_DIR, `${key}.json`), 'utf-8')) as T;
    const meta = JSON.parse(await readFile(join(CACHE_DIR, `${key}.meta.json`), 'utf-8')) as CacheMeta;
    return { data, cachedAt: meta.cachedAt };
  } catch { return null; }
}

async function writeCache(key: string, data: unknown, ttlMs: number, generated?: string): Promise<void> {
  await ensureCacheDir();
  const meta: CacheMeta = { ttlMs, cachedAt: Date.now(), generated };
  const dataPath = join(CACHE_DIR, `${key}.json`);
  const metaPath = join(CACHE_DIR, `${key}.meta.json`);
  await writeFile(dataPath, JSON.stringify(data));
  await writeFile(metaPath, JSON.stringify(meta));
  // Defensive: both OA and CD run as user `hemang`, but if uids ever diverge,
  // group-writable mode keeps the shared cache usable.
  const { chmod } = await import('fs/promises');
  await chmod(dataPath, 0o664);
  await chmod(metaPath, 0o664);
}

function cacheFresh(cachedAt: number, ttlMs: number): boolean {
  return Date.now() - cachedAt < ttlMs;
}

// ── Cross-process lockdir (OA <-> CD coordination) ────────────────────────
// Atomic mkdir-as-lock: only one process per (cmd, args, version) key spawns
// codeburn at a time. The other waits for the cache to land.
const LOCK_STALE_MS = (SPAWN_TIMEOUT_MS * 2) + 5_000;

async function tryAcquireLock(key: string): Promise<boolean> {
  const lockPath = join(CACHE_DIR, `${key}.lockd`);
  try {
    await mkdir(lockPath, { recursive: false });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code !== 'EEXIST') throw err;
    // Stale-break: lockdir older than 2× timeout is presumed dead.
    try {
      const s = await stat(lockPath);
      if (Date.now() - s.mtimeMs > LOCK_STALE_MS) {
        await rm(lockPath, { recursive: true, force: true });
        try { await mkdir(lockPath, { recursive: false }); return true; } catch { /* race */ }
      }
    } catch { /* lock vanished */ }
    return false;
  }
}

async function releaseLock(key: string): Promise<void> {
  const lockPath = join(CACHE_DIR, `${key}.lockd`);
  try { await rm(lockPath, { recursive: true, force: true }); } catch { /* idempotent */ }
}

async function waitForCacheAfterLock<T>(key: string, ttlMs: number): Promise<{ data: T; cachedAt: number } | null> {
  const deadline = Date.now() + SPAWN_TIMEOUT_MS + 5_000;
  while (Date.now() < deadline) {
    const cached = await readCache<T>(key);
    if (cached && cacheFresh(cached.cachedAt, ttlMs)) return cached;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

// ── Main spawn helper ────────────────────────────────────────────────────

async function spawnCodeburn<T>(
  cmd: string,
  cliArgs: string[],
  ttlMs: number,
): Promise<CodeburnResult<T>> {
  const version = await getCodeburnVersion();
  const key = keyFor(cmd, cliArgs, version);

  // 1. fast path — fresh cache
  const cached = await readCache<T>(key);
  if (cached && cacheFresh(cached.cachedAt, ttlMs)) {
    return { ok: true, data: cached.data, cachedAt: cached.cachedAt, fromCache: true };
  }

  // 2. in-flight dedup
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<CodeburnResult<T>>;

  const p = (async (): Promise<CodeburnResult<T>> => {
    if (!(await checkBinary())) {
      return { ok: false, code: 'CODEBURN_NOT_INSTALLED', stderr: '', lastGood: cached?.data ?? null };
    }
    // Cross-process lockdir: prevents OA + CD spawning the same key simultaneously
    await ensureCacheDir();
    const acquired = await tryAcquireLock(key);
    if (!acquired) {
      const fresh = await waitForCacheAfterLock<T>(key, ttlMs);
      if (fresh) return { ok: true, data: fresh.data, cachedAt: fresh.cachedAt, fromCache: true };
      // Other holder failed or timed out — fall through and try ourselves.
      await tryAcquireLock(key);
    }
    try {
      const { stdout } = await execFile(
        CODEBURN_BIN,
        [cmd, ...cliArgs, '--format', 'json'],
        { timeout: SPAWN_TIMEOUT_MS, maxBuffer: MAX_BUFFER, env: { ...process.env, NO_COLOR: '1' } },
      );
      const parsed = JSON.parse(stdout) as T;
      const generated = (parsed as Record<string, unknown>).generated as string | undefined;
      await writeCache(key, parsed, ttlMs, generated);
      return { ok: true, data: parsed, cachedAt: Date.now(), fromCache: false };
    } catch (err: unknown) {
      const e = err as { code?: string; stderr?: Buffer | string; killed?: boolean };
      const stderrRaw: string = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf-8') : String(e.stderr ?? '');
      const code = e.killed ? 'CODEBURN_TIMEOUT' : 'CODEBURN_ERROR';
      return { ok: false, code, stderr: stderrRaw, lastGood: cached?.data ?? null };
    } finally {
      await releaseLock(key);
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, p as Promise<CodeburnResult<unknown>>);
  return p;
}

// ── Public API ───────────────────────────────────────────────────────────

export interface ReportArgs {
  period?: 'today' | 'week' | '30days' | 'month' | 'all';
  from?: string;
  to?: string;
  provider?: 'claude' | 'gemini' | 'cursor' | 'copilot' | 'all';
  project?: string[];        // repeatable substring
  exclude?: string[];        // repeatable substring
}

function buildArgs(a: ReportArgs): string[] {
  const out: string[] = [];
  if (a.period) out.push('-p', a.period);
  // joined form prevents leading-dash project names being parsed as a flag
  if (a.from) out.push(`--from=${a.from}`);
  if (a.to) out.push(`--to=${a.to}`);
  if (a.provider) out.push('--provider', a.provider);
  // joined form prevents leading-dash project names being parsed as a flag
  for (const p of a.project ?? []) out.push(`--project=${p}`);
  for (const x of a.exclude ?? []) out.push(`--exclude=${x}`);
  return out;
}

export async function getReport(a: ReportArgs = {}): Promise<CodeburnResult<CodeburnReport>> {
  // TTL ~150s — half of frontend 5-min poll.
  return spawnCodeburn<CodeburnReport>('report', buildArgs(a), 150_000);
}

export async function getStatus(a: { period?: ReportArgs['period']; menubarFormat?: boolean } = {}):
  Promise<CodeburnResult<CodeburnStatus | CodeburnMenubar>> {
  const args: string[] = [];
  if (a.period) args.push('-p', a.period);
  // status supports --format menubar-json (richer) — choose based on caller
  const format = a.menubarFormat ? 'menubar-json' : 'json';
  // override default --format json injection by spawning manually
  const version = await getCodeburnVersion();
  const key = keyFor('status', [...args, format], version);
  const ttlMs = 30_000;
  const cached = await readCache<CodeburnStatus | CodeburnMenubar>(key);
  if (cached && cacheFresh(cached.cachedAt, ttlMs)) {
    return { ok: true, data: cached.data, cachedAt: cached.cachedAt, fromCache: true };
  }
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<CodeburnResult<CodeburnStatus | CodeburnMenubar>>;
  const p = (async (): Promise<CodeburnResult<CodeburnStatus | CodeburnMenubar>> => {
    if (!(await checkBinary())) {
      return { ok: false, code: 'CODEBURN_NOT_INSTALLED', stderr: '', lastGood: cached?.data ?? null };
    }
    await ensureCacheDir();
    const acquired = await tryAcquireLock(key);
    if (!acquired) {
      const fresh = await waitForCacheAfterLock<CodeburnStatus | CodeburnMenubar>(key, ttlMs);
      if (fresh) return { ok: true, data: fresh.data, cachedAt: fresh.cachedAt, fromCache: true };
      await tryAcquireLock(key);
    }
    try {
      const { stdout } = await execFile(
        CODEBURN_BIN,
        ['status', ...args, '--format', format],
        { timeout: SPAWN_TIMEOUT_MS, maxBuffer: MAX_BUFFER, env: { ...process.env, NO_COLOR: '1' } },
      );
      const parsed = JSON.parse(stdout);
      await writeCache(key, parsed, ttlMs, parsed.generated);
      return { ok: true, data: parsed, cachedAt: Date.now(), fromCache: false };
    } catch (err: unknown) {
      const e = err as { killed?: boolean; stderr?: Buffer | string };
      const stderrRaw2: string = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf-8') : String(e.stderr ?? '');
      return { ok: false, code: e.killed ? 'CODEBURN_TIMEOUT' : 'CODEBURN_ERROR', stderr: stderrRaw2, lastGood: cached?.data ?? null };
    } finally {
      await releaseLock(key);
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, p as Promise<CodeburnResult<unknown>>);
  return p;
}

export async function getProjects(): Promise<CodeburnResult<CodeburnProject[]>> {
  // Project list is derived from a 30day report — gives the union of recently-active projects.
  const r = await getReport({ period: '30days' });
  if (!r.ok) return { ok: false, code: r.code, stderr: r.stderr, lastGood: r.lastGood?.projects ?? null };
  return { ok: true, data: r.data.projects, cachedAt: r.cachedAt, fromCache: r.fromCache };
}

export async function bustCache(_filter?: { command?: string; period?: string }): Promise<number> {
  // Walk cache dir and remove matching files. Return count removed.
  const { readdir } = await import('fs/promises');
  let removed = 0;
  if (!existsSync(CACHE_DIR)) return 0;
  const files = await readdir(CACHE_DIR);
  for (const f of files) {
    if (!f.endsWith('.json') && !f.endsWith('.meta.json') && !f.endsWith('.lockd')) continue;
    // simplistic: bust everything if no filter; extended busting is v2
    await rm(join(CACHE_DIR, f), { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

// Warm the cache on adapter import (fire-and-forget)
export function warmCache(): void {
  void getReport({ period: 'week' });
  void getStatus({ period: 'today' });
}
