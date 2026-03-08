import fs from "node:fs";
import path from "node:path";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.resume();
  });
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

function appendEvent(projectDir, event) {
  const dir = path.join(projectDir, ".claude", "ccmanager");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "events.jsonl");
  fs.appendFileSync(file, JSON.stringify(event) + "\n", "utf8");
}

async function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
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