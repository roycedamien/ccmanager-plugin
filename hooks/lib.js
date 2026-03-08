import fs from "node:fs";
import path from "node:path";

/**
 * Read all of stdin as a string.
 */
export function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.resume();
  });
}

/**
 * Parse JSON, falling back to { _raw: text } on failure.
 */
export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

/**
 * Ensure the log directory exists and append an event object as a JSON line.
 */
export function appendEvent(projectDir, event) {
  const dir = path.join(projectDir, ".claude", "ccmanager");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "events.jsonl");
  fs.appendFileSync(file, JSON.stringify(event) + "\n", "utf8");
}

/**
 * Return the project directory from the environment or cwd.
 */
export function getProjectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}
