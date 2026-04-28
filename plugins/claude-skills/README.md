# OctoAlly — Claude Skills Plugin

Exposes the user's `~/.claude/skills/` library inside the OctoAlly web UI so skills can be invoked from the browser instead of typing `/slashcommand` in the terminal.

---

## What this plugin is

Claude Code ships a global skills directory at `~/.claude/skills/`. Each skill is a folder containing a `SKILL.md` file with YAML frontmatter (`name`, `description`, `trigger`, `user-invocable`) and instruction prose. Skills can be invoked as slash commands (e.g. `/advisor`, `/ultra-plan "topic"`).

This plugin:
1. **Discovers** all installed skills by scanning `~/.claude/skills/*/SKILL.md` at build time and on-demand at runtime.
2. **Renders** a searchable skill picker (`SkillPicker.tsx`) in the OctoAlly sidebar / input toolbar.
3. **Invokes** the selected skill by injecting the appropriate `/slashcommand` into the chat input (or calling the OctoAlly API endpoint directly in Phase 3).

---

## Files

| File | Purpose |
|---|---|
| `discover-skills.mjs` | Node script — reads SKILL.md files, parses frontmatter, emits JSON array to stdout |
| `skills.json` | Committed snapshot of discovery output; used for fast first-load without disk read |
| `SkillPicker.stub.tsx` | React component stub (Phase 1 — not yet wired into the UI) |
| `README.md` | This file |
| `.gitignore` | Ignores `node_modules/` if any are ever added |

---

## How skill discovery works

```
~/.claude/skills/
  advisor-strategy/
    SKILL.md          ← frontmatter: name, description, trigger
  ultra-plan/
    SKILL.md
  ...
```

`discover-skills.mjs` does the following:

1. `readdir(~/.claude/skills)` — list all subdirectories, skip `_archived` and non-dirs.
2. For each dir, `readFile(dir/SKILL.md)` — fail silently if missing.
3. Parse the `---` frontmatter block with a minimal YAML parser (no external deps).
4. Extract `name`, `description` (first sentence, ≤200 chars), `trigger` (frontmatter field or body regex), `user-invocable`.
5. Sort alphabetically, emit JSON array.

The script has **zero runtime dependencies** — only Node built-ins (`fs/promises`, `path`, `os`). It works with Node 18+.

To refresh `skills.json` after adding or modifying a skill:

```bash
node plugins/claude-skills/discover-skills.mjs > plugins/claude-skills/skills.json
```

---

## Wire-up plan (Phase 2)

### Step 1 — Backend refresh endpoint

Add a route to the OctoAlly server (`server/`) that shells out to `discover-skills.mjs` and returns fresh JSON:

```
GET /api/skills
→ 200 { skills: [...] }
```

File: `server/routes/skills.ts` (or `.js` if the server is not TypeScript).

### Step 2 — Import SkillPicker into the sidebar

In the OctoAlly frontend (`dashboard/src/` or similar):

```tsx
import { SkillPicker } from '../../plugins/claude-skills/SkillPicker';

// Inside the chat sidebar or toolbar:
<SkillPicker
  onSkillInvoke={(name, trigger) => {
    appendToChatInput(trigger ?? `/${name}`);
  }}
/>
```

Replace the stub import with the real component once the sidebar target is identified.

### Step 3 — Argument support

Skills like `/ultra-plan "topic"` require a freeform argument after the trigger. Phase 3 adds an argument input field that appears below the dropdown when a selected skill's description mentions an `argument-hint` frontmatter field.

### Step 4 — Feature flag

Gate the plugin behind `VITE_SKILLS_PLUGIN_ENABLED=true` in `.env.local` until fully stable.

---

## Skill descriptor schema

Each entry in `skills.json`:

```ts
{
  slug: string;          // directory name, e.g. "advisor-strategy"
  name: string;          // frontmatter `name` field, e.g. "advisor-strategy"
  description: string;   // first sentence of frontmatter description, ≤200 chars
  trigger: string | null;// e.g. "/advisor", "/ultra-plan", null if no trigger
  userInvocable: boolean;// true when frontmatter has `user-invocable: true`
  path: string;          // absolute path to SKILL.md on this server
}
```

---

## Current skill count

32 skills discovered (as of last `skills.json` regeneration).

Run `node discover-skills.mjs | jq 'length'` to get the live count.

---

## Scope fence

This plugin directory (`plugins/claude-skills/`) is self-contained. It does NOT modify:
- `~/.claude/` or any skill files
- `server/` or `dashboard/` (until Phase 2 integration)
- Any other OctoAlly files
