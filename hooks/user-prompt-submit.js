import { readStdin, safeJsonParse, appendEvent, getProjectDir } from "./lib.js";

async function main() {
  const projectDir = getProjectDir();
  const raw = await readStdin();
  const input = safeJsonParse(raw);

  appendEvent(projectDir, {
    ts: new Date().toISOString(),
    hook_event_name: input.hook_event_name ?? "UserPromptSubmit",
    session_id: input.session_id ?? null,
    prompt: input.prompt ?? null,
    data: input
  });

  process.exit(0);
}

main().catch(() => process.exit(0));