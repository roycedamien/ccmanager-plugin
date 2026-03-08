import { readStdin, safeJsonParse, appendEvent, getProjectDir } from "./lib.js";

async function main() {
  const projectDir = getProjectDir();
  const raw = await readStdin();
  const input = safeJsonParse(raw);

  const event = {
    ts: new Date().toISOString(),
    hook_event_name: input.hook_event_name ?? "SessionStart",
    session_id: input.session_id ?? null,
    data: input
  };

  appendEvent(projectDir, event);

  // Optionally inject context (keep empty for MVP)
  // If you want to do this later:
  // console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: "..." } }));

  process.exit(0);
}

main().catch(() => process.exit(0));