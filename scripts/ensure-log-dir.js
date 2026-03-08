import fs from "node:fs";
import path from "node:path";

export function ensureLogDir(projectDir) {
  const dir = path.join(projectDir, ".claude", "ccmanager");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}