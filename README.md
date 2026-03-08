# ccmanager (Claude Code plugin) — MVP

MVP plugin that:
- logs Claude Code hook events to `.claude/ccmanager/events.jsonl`
- serves a local web UI at `http://127.0.0.1:7337` showing recent events

## Install (standalone plugin)

This repo is intended to be installed as a Claude Code plugin.

1. Clone somewhere:
   ```bash
   git clone https://github.com/roycedamien/ccmanager-plugin.git
   cd ccmanager-plugin
   ```

2. Install / link it using Claude Code’s plugin install mechanism (varies by version).
   - Ensure Claude Code can find `.claude-plugin/plugin.json`.

## Usage

Inside Claude Code:
- Run `/ccmanager` to start the local UI server.
- Open: http://127.0.0.1:7337

Logs are written to:
- `.claude/ccmanager/events.jsonl` (in your current Claude project directory)

## Uninstall

Remove the plugin from Claude Code’s plugin directory / uninstall list.

## Development notes

- Hook scripts are Node programs in `hooks/` that read stdin JSON and append to JSONL.
- Server is a tiny Node HTTP server (no deps) in `server/index.js`.