#!/usr/bin/env bash
# Emit the most recent tmux buffer as OSC 52 into a pane's output stream.
# OctoAlly mirrors panes without an attached tmux client, so tmux's native
# copy-mode OSC 52 emission (client-tty only) never reaches the browser.
# Writing to the pane's pts slave injects the sequence into the pane output,
# which the pty-worker pipe forwards to the browser terminal (xterm handles
# OSC 52 since 2026-07-02 — Terminal.tsx registerOscHandler).
# ponytail: uses the newest buffer — single-user, concurrent-copy race accepted.
pane_tty="$1"
[ -w "$pane_tty" ] || exit 0
sock="${TMUX%%,*}"   # run-shell sets TMUX to the invoking server's socket
b64=$( { [ -n "$sock" ] && tmux -S "$sock" show-buffer || tmux -L octoally show-buffer; } 2>/dev/null | head -c 100000 | base64 -w0)
[ -n "$b64" ] && printf '\033]52;c;%s\a' "$b64" > "$pane_tty"
exit 0
