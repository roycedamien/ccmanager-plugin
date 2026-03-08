import { readStdin, safeJsonParse, appendEvent, getProjectDir } from "./lib.js";

async function main() {
  const projectDir = getProjectDir();
  const raw = await readStdin();
  const input = safeJsonParse(raw);

  appendEvent(projectDir, {
    ts: new Date().toISOString(),
    hook_event_name: input.hook_event_name ?? "Stop",
    session_id: input.session_id ?? null,
    transcript_path: input.transcript_path ?? null,
    data: input
  });

  // MVP: never block stop
  process.exit(0);
}

main().catch(() => process.exit(0));