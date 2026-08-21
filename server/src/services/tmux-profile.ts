/**
 * Isolated tmux profile for the `octoally` socket (`tmux -L octoally`).
 *
 * The first `tmux -L octoally new-session` otherwise loads ~/.tmux.conf.
 * That file currently has `setw -g alternate-screen off` (2026-08-05, Claude
 * scrollback experiment). Combined with the old `smcup@:rmcup@` override in
 * pty-worker, Grok/Claude TUIs paint on the primary screen and dump frames
 * into pane history — chat, tool blocks, and the prompt then appear to drift
 * at different rates. This profile never loads ~/.tmux.conf and never
 * disables the alternate screen.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const execFileAsync = promisify(execFile);

export const OCTOALLY_TMUX_SOCKET = 'octoally';

export const OCTOALLY_TMUX_CONF = `# OctoAlly tmux server — loaded via -f, never ~/.tmux.conf
set -g default-terminal "tmux-256color"
set -g history-limit 50000
set -g escape-time 10
set -s focus-events off
set -g status off
set -s set-clipboard on
set -s extended-keys on
setw -g alternate-screen on
setw -g allow-passthrough on
set -as terminal-features ",xterm*:RGB"
set -s terminal-overrides "xterm-256color:RGB"
`;

/** Server/window options applied to a live octoally socket (no mouse/status
 *  globals — those would clobber non-of-* sessions sharing the socket). */
export const TMUX_LIVE_COMMANDS: string[][] = [
  ['set-option', '-s', 'extended-keys', 'on'],
  ['set-option', '-s', 'set-clipboard', 'on'],
  ['set-option', '-s', 'escape-time', '10'],
  ['set-option', '-s', 'focus-events', 'off'],
  ['set-option', '-s', 'terminal-overrides', 'xterm-256color:RGB'],
  ['set-option', '-as', 'terminal-features', 'xterm*:RGB'],
  ['set-option', '-g', 'default-terminal', 'tmux-256color'],
  ['set-option', '-g', 'history-limit', '50000'],
  ['set-window-option', '-g', 'alternate-screen', 'on'],
  ['set-window-option', '-g', 'allow-passthrough', 'on'],
];

export function octoallyTmuxConfPath(): string {
  const dir = join(homedir(), '.octoally');
  mkdirSync(dir, { recursive: true });
  return join(dir, 'tmux.conf');
}

export function writeOctoallyTmuxConf(): string {
  const p = octoallyTmuxConfPath();
  writeFileSync(p, OCTOALLY_TMUX_CONF);
  return p;
}

export function tmuxProfileHasForbidden(text: string): string[] {
  const hits: string[] = [];
  if (text.includes('smcup@') || text.includes('rmcup@')) hits.push('smcup@/rmcup@');
  if (/alternate-screen\s+off/.test(text)) hits.push('alternate-screen off');
  return hits;
}

function tmuxBase(socket: string): string[] {
  return ['-L', socket];
}

async function tmuxRun(socket: string, args: string[]): Promise<void> {
  await execFileAsync('tmux', [...tmuxBase(socket), ...args], { timeout: 5000 });
}

export async function applyOctoallyTmuxProfile(opts: {
  socket?: string;
  sessionName?: string;
} = {}): Promise<void> {
  const socket = opts.socket ?? OCTOALLY_TMUX_SOCKET;
  for (const cmd of TMUX_LIVE_COMMANDS) {
    try {
      await tmuxRun(socket, cmd);
    } catch {
      // No server yet — tmuxCreate will start it with -f.
      return;
    }
  }

  try {
    const { stdout } = await execFileAsync('tmux', [
      ...tmuxBase(socket), 'list-windows', '-a', '-F', '#{session_name}:#{window_index}',
    ], { timeout: 5000 });
    for (const target of stdout.split('\n').map(s => s.trim()).filter(Boolean)) {
      try { await tmuxRun(socket, ['set-window-option', '-t', target, 'alternate-screen', 'on']); } catch { /* gone */ }
      try { await tmuxRun(socket, ['set-window-option', '-t', target, 'allow-passthrough', 'on']); } catch { /* gone */ }
    }
  } catch {
    /* no windows */
  }

  const sessions: string[] = [];
  if (opts.sessionName) sessions.push(opts.sessionName);
  try {
    const { stdout } = await execFileAsync('tmux', [
      ...tmuxBase(socket), 'list-sessions', '-F', '#{session_name}',
    ], { timeout: 5000 });
    for (const name of stdout.split('\n').map(s => s.trim()).filter(Boolean)) {
      if (name.startsWith('of-') && !sessions.includes(name)) sessions.push(name);
    }
  } catch {
    /* no server */
  }

  for (const name of sessions) {
    for (const cmd of [
      ['set-option', '-t', name, 'status', 'off'],
      ['set-option', '-t', name, 'mouse', 'off'],
      ['set-option', '-t', name, 'history-limit', '50000'],
    ] as string[][]) {
      try { await tmuxRun(socket, cmd); } catch { /* session gone */ }
    }
  }
}
