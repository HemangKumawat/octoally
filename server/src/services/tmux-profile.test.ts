import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  OCTOALLY_TMUX_CONF,
  TMUX_LIVE_COMMANDS,
  tmuxProfileHasForbidden,
} from './tmux-profile.js';

test('octoally tmux conf never disables alt-screen', () => {
  assert.deepEqual(tmuxProfileHasForbidden(OCTOALLY_TMUX_CONF), []);
  assert.match(OCTOALLY_TMUX_CONF, /alternate-screen on/);
  assert.match(OCTOALLY_TMUX_CONF, /extended-keys on/);
  assert.match(OCTOALLY_TMUX_CONF, /allow-passthrough on/);
  assert.match(OCTOALLY_TMUX_CONF, /xterm-256color:RGB/);
  assert.match(OCTOALLY_TMUX_CONF, /set-clipboard on/);
  assert.doesNotMatch(OCTOALLY_TMUX_CONF, /smcup@|rmcup@/);
});

test('live commands restore RGB and alt-screen, never smcup@', () => {
  const flat = TMUX_LIVE_COMMANDS.map(c => c.join(' ')).join('\n');
  assert.equal(tmuxProfileHasForbidden(flat).length, 0);
  assert.ok(flat.includes('alternate-screen on'));
  assert.ok(flat.includes('xterm-256color:RGB'));
  assert.ok(flat.includes('extended-keys on'));
  assert.ok(flat.includes('allow-passthrough on'));
  assert.ok(!flat.includes('mouse'));
});
