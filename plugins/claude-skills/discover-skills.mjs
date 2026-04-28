#!/usr/bin/env node
/**
 * discover-skills.mjs
 * Reads ~/.claude/skills/*\/SKILL.md, parses YAML frontmatter,
 * emits a JSON array of skill descriptors to stdout.
 *
 * Usage:
 *   node discover-skills.mjs            → prints JSON to stdout
 *   node discover-skills.mjs --pretty   → pretty-printed JSON
 *
 * Schema per entry:
 * {
 *   slug: string,          // directory name under ~/.claude/skills/
 *   name: string,          // `name` field from frontmatter (falls back to slug)
 *   description: string,   // `description` field (first paragraph, trimmed)
 *   trigger: string|null,  // slash command trigger if present (e.g. "/advisor")
 *   userInvocable: boolean,// true if `user-invocable: true` in frontmatter
 *   path: string,          // absolute path to SKILL.md
 * }
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SKILLS_DIR = join(homedir(), '.claude', 'skills');
const SKIP_DIRS = new Set(['_archived', '_templates']);

/**
 * Minimal YAML frontmatter parser — handles the subset used in SKILL.md files:
 *   - scalar strings (quoted and unquoted)
 *   - block scalars (> and |)
 *   - boolean values
 * Returns a plain object with string values.
 */
function parseFrontmatter(raw) {
  const fm = {};
  // Extract content between first pair of --- delimiters
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return fm;

  const block = match[1];
  const lines = block.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Match key: value or key: > (block scalar opener)
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    let value = keyMatch[2].trim();

    if (value === '>' || value === '|') {
      // Block scalar — collect indented continuation lines
      const parts = [];
      i++;
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
        parts.push(lines[i].trim());
        i++;
      }
      value = parts.filter(Boolean).join(' ').trim();
    } else {
      // Strip surrounding quotes
      value = value.replace(/^['"]|['"]$/g, '');
      i++;
    }

    fm[key] = value;
  }

  return fm;
}

/**
 * Extract the first slash-command trigger from the body of a SKILL.md.
 * Looks for patterns like: Trigger: `/advisor`, `/ultra-plan or /ultraplan`, etc.
 */
function extractTrigger(body) {
  // Check frontmatter trigger field first (some skills have it)
  // Then look in body for "Trigger:" lines with /slashcommand
  const triggerLine = body.match(/Trigger[s]?:\s*`?(\/?[\w-]+)`?/i);
  if (triggerLine) {
    const t = triggerLine[1].trim();
    return t.startsWith('/') ? t : '/' + t;
  }
  // Look for "User types /foo" pattern
  const userTypes = body.match(/types?\s+`(\/[\w-]+)`/i);
  if (userTypes) return userTypes[1];
  return null;
}

async function discoverSkills() {
  let entries;
  try {
    entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch (err) {
    process.stderr.write(`[discover-skills] Cannot read skills dir: ${err.message}\n`);
    process.exit(1);
  }

  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const slug = entry.name;
    const skillPath = join(SKILLS_DIR, slug, 'SKILL.md');

    let raw;
    try {
      raw = await readFile(skillPath, 'utf8');
    } catch {
      // No SKILL.md — skip silently
      continue;
    }

    const fm = parseFrontmatter(raw);

    // Extract body (everything after the closing --- of frontmatter)
    const bodyMatch = raw.match(/^---[\s\S]*?---\r?\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : raw;

    // Build description — flatten multi-line block scalars, strip leading >
    let description = (fm.description || fm.desc || '').trim();
    // Remove YAML block scalar markers that leaked through
    description = description.replace(/^>\s*/, '').trim();
    // Trim to first sentence or 200 chars for UI readability
    const firstSentence = description.split(/\.\s+/)[0];
    const shortDesc = firstSentence.length > 200
      ? firstSentence.slice(0, 197) + '...'
      : firstSentence;

    const trigger = fm.trigger || extractTrigger(body);
    const userInvocable = fm['user-invocable'] === 'true' || fm['user-invocable'] === true;

    skills.push({
      slug,
      name: fm.name || slug,
      description: shortDesc || `${slug} skill`,
      trigger: trigger || null,
      userInvocable,
      path: skillPath,
    });
  }

  // Sort alphabetically by slug for stable output
  skills.sort((a, b) => a.slug.localeCompare(b.slug));
  return skills;
}

const pretty = process.argv.includes('--pretty');
const skills = await discoverSkills();
process.stdout.write(JSON.stringify(skills, null, pretty ? 2 : 0) + '\n');
