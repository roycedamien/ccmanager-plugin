# ccmanager (Claude Code plugin)

Plugin that:
- logs Claude Code hook events to `.claude/ccmanager/events.jsonl`
- serves a local web UI at `http://127.0.0.1:7337` with session & event filtering

## Install (standalone plugin)

This repo is intended to be installed as a Claude Code plugin.

1. Clone somewhere:
   ```bash
   git clone https://github.com/roycedamien/ccmanager-plugin.git
   cd ccmanager-plugin
   ```

2. Install / link it using Claude Code's plugin install mechanism (varies by version).
   - Ensure Claude Code can find `.claude-plugin/plugin.json`.

## Usage

Inside Claude Code:
- Run `/ccmanager` to start the local UI server.
- Open: http://127.0.0.1:7337

Logs are written to:
- `.claude/ccmanager/events.jsonl` (in your current Claude project directory)

### Web UI features

- **Session list** — click a session to filter events to that session
- **Event type filter** — dropdown to show only specific hook events
- **Auto-refresh** — UI polls for new events every 3 seconds

### API

- `GET /api/events?limit=N&session_id=ID&event_type=TYPE` — returns logged events with optional filters
- `GET /api/sessions` — returns per-session summaries sorted by recency

## Uninstall

Remove the plugin from Claude Code's plugin directory / uninstall list.

## Development

- Hook scripts are Node programs in `hooks/` sharing a common library (`hooks/lib.js`).
- Server is a zero-dependency Node HTTP server in `server/index.js`.
- Run tests: `npm test`
