import { execFile } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { promisify } from 'util';
import { resolve, dirname, basename } from 'path';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Loop 3 — THE KEYSTONE: scaffold a real project from an APPROVED intent frame.
//
// This is the first time the voice→Jarvis loop ACTS on an idea. It WRITES to
// the filesystem, so the sandbox here is non-negotiable. The contract:
//   * NEW top-level dir ONLY: /home/hemang/<slug>/ where <slug> is sanitized
//     to lowercase [a-z0-9-]. Any '/', '..', leading dot, or absolute path in
//     the source is stripped/rejected — the resolved path MUST live directly
//     under /home/hemang and MUST NOT already exist (never overwrite/merge).
//   * Creates ONLY: the dir, a LOCAL `git init` (never gh/remote/push), a
//     minimal CLAUDE.md + README.md derived from the frame's presumption.
//   * NOTHING ELSE: no code execution of the scaffolded project, no package
//     installs, no network calls, no running anything.
//
// The endpoint that calls this owns the approval gate (status==approved) and
// the audit log / status flip / Telegram. This module only does the sandboxed
// filesystem write and returns a structured outcome.
// ---------------------------------------------------------------------------

const HOME_ROOT = '/home/hemang';

export interface ScaffoldInput {
  frameId: string;
  // The presumed.title / presumed.home are the preferred slug source; idea_raw
  // is the fallback. We pass the whole presumed object + idea so we can derive
  // both the slug and a meaningful CLAUDE.md/README stub.
  title?: string | null;
  home?: string | null;
  ideaRaw?: string | null;
  oneLine?: string | null;
  projectKind?: string | null;
  framework?: string | null; // presumed.stack summarized, free-text
}

export type ScaffoldOutcome =
  | {
      ok: true;
      slug: string;
      path: string;
      created: { dir: true; git: boolean; claudeMd: true; readme: true };
    }
  | {
      ok: false;
      error: string;
      // 'invalid-slug' | 'unsafe-path' | 'exists' | 'mkdir-failed' | ...
      code: string;
      slug?: string;
      path?: string;
    };

export type SlugResult =
  | { ok: true; slug: string }
  | { ok: false; code: 'invalid-slug' | 'unsafe-home'; error: string };

function sanitizeToSlug(source: string): string | null {
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // any non-alnum run -> single dash
    .replace(/^-+|-+$/g, '')     // trim leading/trailing dashes
    .replace(/^\.+/, '')         // belt-and-suspenders: no leading dots
    .slice(0, 64)
    .replace(/-+$/g, '');        // re-trim after slice
  if (!slug || slug.length < 1) return null;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;
  if (slug === '.' || slug === '..') return null;
  return slug;
}

// Derive a filesystem-safe slug. Strategy, in priority order:
//   1. presumed.home — if it is ABSOLUTE, it must resolve to a direct child of
//      /home/hemang (the presumption is supposed to choose a top-level home).
//      An absolute home that points anywhere ELSE (/etc, ../../, traversal) is
//      a red flag and is REFUSED outright (`unsafe-home`) — we do NOT silently
//      relocate it into the sandbox, because that would hide that the
//      presumption asked to write somewhere it shouldn't. A relative home is
//      treated as a plain name and sanitized.
//   2. presumed.title.
//   3. idea_raw.
// All slug SOURCES are then allowlist-sanitized: lowercase, non-[a-z0-9] runs
// collapse to a dash, leading/trailing dashes + leading dots stripped, capped.
// '..' and '/' cannot survive into a slug because they are not in [a-z0-9-].
export function deriveSlug(input: ScaffoldInput): SlugResult {
  let source = '';
  if (input.home && typeof input.home === 'string' && input.home.trim()) {
    const home = input.home.trim();
    if (home.startsWith('/')) {
      // Absolute home: resolve and require it be a STRICT direct child of
      // HOME_ROOT. resolve() collapses any ../ — '/home/hemang/../../etc/x'
      // resolves to '/etc/x', whose parent != HOME_ROOT -> refused.
      const resolved = resolve(home.replace(/\/+$/, ''));
      if (dirname(resolved) !== HOME_ROOT || resolved === HOME_ROOT) {
        return {
          ok: false,
          code: 'unsafe-home',
          error: `frame's home '${home}' is not a direct child of ${HOME_ROOT}`,
        };
      }
      source = basename(resolved);
    } else {
      // Relative home: treat the last path segment as a plain name.
      source = basename(home.replace(/\/+$/, ''));
    }
  }
  if (!source && input.title) source = input.title;
  if (!source && input.ideaRaw) source = input.ideaRaw;
  if (!source) {
    return { ok: false, code: 'invalid-slug', error: 'no slug source in frame' };
  }

  const slug = sanitizeToSlug(source);
  if (!slug) {
    return { ok: false, code: 'invalid-slug', error: 'could not derive a safe slug' };
  }
  return { ok: true, slug };
}

function claudeMdStub(slug: string, input: ScaffoldInput): string {
  const title = (input.title && input.title.trim()) || slug;
  const oneLine = (input.oneLine && input.oneLine.trim()) || '(no one-line description presumed)';
  const kind = (input.projectKind && input.projectKind.trim()) || 'unspecified';
  const framework = (input.framework && input.framework.trim()) || 'unspecified';
  return `# ${title} — Project Configuration

> Scaffolded by the Voice→Jarvis meta-loop (Loop 3 keystone) from an APPROVED
> intent frame. Frame id: \`${input.frameId}\`. Slug: \`${slug}\`.
> This is a STUB. Nothing here has been built or run — only the directory,
> a local git repo, and these two files were created.

## What this is
- **Title:** ${title}
- **One-line:** ${oneLine}
- **Project kind:** ${kind}
- **Presumed framework / stack:** ${framework}

## Origin
This project began as a spoken idea captured by Nexus Voice, presumed into a
structured frame, reviewed and APPROVED by Hemang, then scaffolded here. The
approval was the human-in-the-loop gate — nothing acts on a frame until its
status is \`approved\`.

## Conventions (inherited)
- Lives at top-level \`${HOME_ROOT}/${slug}/\` (never nested).
- Keep files under 500 lines; prefer editing existing files over creating new ones.
- Never bind infra ports 3333 / 8199 / 11435 / 42010.
- Ground-truth-first; verify-on-ship (writer emits, reader reads, state changes).

## Next steps
The scaffold intentionally stops here. Building the actual project is a separate,
explicit step (e.g. \`/ultra-plan\` from this frame) — the keystone only proves
the loop can ACT on an approved idea safely.
`;
}

function readmeStub(slug: string, input: ScaffoldInput): string {
  const title = (input.title && input.title.trim()) || slug;
  const oneLine = (input.oneLine && input.oneLine.trim()) || '';
  const framework = (input.framework && input.framework.trim()) || 'unspecified';
  return `# ${title}

${oneLine ? oneLine + '\n' : ''}
Scaffolded from an approved Nexus Voice intent frame (\`${input.frameId}\`).

- **Presumed stack:** ${framework}
- **Status:** scaffold only — not yet built or run.

This directory contains only an empty git repo and two stub docs. See
\`CLAUDE.md\` for the full origin and conventions.
`;
}

// The sandboxed scaffold. Async because `git init` is a subprocess. Returns a
// structured outcome — NEVER throws for an expected refusal (caller maps the
// outcome to an HTTP status). Throws only on genuinely unexpected errors.
export async function scaffoldProject(input: ScaffoldInput): Promise<ScaffoldOutcome> {
  const slugResult = deriveSlug(input);
  if (!slugResult.ok) {
    // `unsafe-home` (absolute home pointing outside the sandbox) and
    // `invalid-slug` (no derivable safe name) are both hard refusals with no
    // side effect — the caller maps them to a 422.
    return { ok: false, error: slugResult.error, code: slugResult.code };
  }
  const slug = slugResult.slug;

  // Build the target path from the trusted root + the sanitized slug ONLY.
  // Then resolve() and assert the resolved path is EXACTLY HOME_ROOT/<slug> —
  // i.e. its parent is HOME_ROOT and its basename is the slug. This is the
  // hard fence: even if slug derivation had a bug, a path that escapes
  // /home/hemang or nests deeper is rejected here with no side-effect.
  const path = resolve(HOME_ROOT, slug);
  if (dirname(path) !== HOME_ROOT || basename(path) !== slug) {
    return { ok: false, error: 'resolved path escaped the sandbox root', code: 'unsafe-path', slug, path };
  }
  // Defensive: must be a strict child of HOME_ROOT, never HOME_ROOT itself.
  if (path === HOME_ROOT || !path.startsWith(HOME_ROOT + '/')) {
    return { ok: false, error: 'resolved path is not under the sandbox root', code: 'unsafe-path', slug, path };
  }

  // REFUSE if the target already exists — never overwrite or merge.
  if (existsSync(path)) {
    return { ok: false, error: `target directory already exists: ${path}`, code: 'exists', slug, path };
  }

  // Create the directory. Not recursive across new parents (parent is the
  // existing HOME_ROOT), so a missing parent would surface as an error rather
  // than silently creating a tree.
  try {
    mkdirSync(path, { recursive: false, mode: 0o755 });
  } catch (e: any) {
    return { ok: false, error: `mkdir failed: ${e?.message || e}`, code: 'mkdir-failed', slug, path };
  }

  // Write the two stub files BEFORE git init so the initial repo state is
  // meaningful if anyone later commits. No network, no execution of content.
  try {
    writeFileSync(`${path}/CLAUDE.md`, claudeMdStub(slug, input), 'utf-8');
    writeFileSync(`${path}/README.md`, readmeStub(slug, input), 'utf-8');
  } catch (e: any) {
    return { ok: false, error: `failed to write stub files: ${e?.message || e}`, code: 'write-failed', slug, path };
  }

  // LOCAL git init only. Explicitly: no remote, no gh, no push. We pin the
  // initial branch name and run git in the new dir with a fixed argv (no shell).
  // A git failure is non-fatal to the scaffold (dir + docs already exist) — we
  // report git:false rather than fail the whole op, so the audit log is honest.
  let gitOk = false;
  try {
    await execFileAsync('git', ['init', '-q', '-b', 'main', path], { timeout: 15_000 });
    gitOk = true;
  } catch {
    gitOk = false;
  }

  return {
    ok: true,
    slug,
    path,
    created: { dir: true, git: gitOk, claudeMd: true, readme: true },
  };
}
