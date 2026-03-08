import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execSync } from "node:child_process";

/** Helper: make an HTTP GET and return parsed JSON. */
async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${body}`));
        }
      });
    }).on("error", reject);
  });
}

/** Helper: make an HTTP GET and return { statusCode, body }. */
async function getRaw(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, body }));
    }).on("error", reject);
  });
}

describe("server API", () => {
  let tmpDir;
  let proc;
  let port;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ccmanager-srv-"));
    port = 17337 + Math.floor(Math.random() * 10000);

    // Write some test events
    const logDir = path.join(tmpDir, ".claude", "ccmanager");
    fs.mkdirSync(logDir, { recursive: true });
    const events = [
      { ts: "2026-01-01T00:00:00Z", hook_event_name: "SessionStart", session_id: "s1" },
      { ts: "2026-01-01T00:01:00Z", hook_event_name: "PreToolUse", session_id: "s1", tool_name: "Bash" },
      { ts: "2026-01-01T00:02:00Z", hook_event_name: "PostToolUse", session_id: "s1", tool_name: "Bash" },
      { ts: "2026-01-01T01:00:00Z", hook_event_name: "SessionStart", session_id: "s2" },
      { ts: "2026-01-01T01:01:00Z", hook_event_name: "UserPromptSubmit", session_id: "s2" },
      { ts: "2026-01-01T01:02:00Z", hook_event_name: "Stop", session_id: "s2" },
    ];
    fs.writeFileSync(
      path.join(logDir, "events.jsonl"),
      events.map((e) => JSON.stringify(e)).join("\n") + "\n",
      "utf8"
    );

    // Start server
    const { spawn } = await import("node:child_process");
    const serverPath = path.resolve("server/index.js");
    proc = spawn("node", [serverPath], {
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: tmpDir,
        CCMANAGER_PORT: String(port),
        CCMANAGER_HOST: "127.0.0.1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Server start timeout")), 5000);
      proc.stdout.on("data", (data) => {
        if (data.toString().includes("ccmanager UI")) {
          clearTimeout(timeout);
          resolve();
        }
      });
      proc.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  afterEach(() => {
    if (proc) {
      proc.kill("SIGTERM");
      proc = null;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("GET /api/events returns all events", async () => {
    const data = await getJson(`http://127.0.0.1:${port}/api/events`);
    assert.strictEqual(data.total, 6);
    assert.strictEqual(data.events.length, 6);
  });

  it("GET /api/events?limit=2 returns limited events", async () => {
    const data = await getJson(`http://127.0.0.1:${port}/api/events?limit=2`);
    assert.strictEqual(data.total, 6);
    assert.strictEqual(data.events.length, 2);
  });

  it("GET /api/events?session_id=s1 filters by session", async () => {
    const data = await getJson(`http://127.0.0.1:${port}/api/events?session_id=s1`);
    assert.strictEqual(data.events.length, 3);
    for (const e of data.events) {
      assert.strictEqual(e.session_id, "s1");
    }
  });

  it("GET /api/events?event_type=SessionStart filters by event type", async () => {
    const data = await getJson(`http://127.0.0.1:${port}/api/events?event_type=SessionStart`);
    assert.strictEqual(data.events.length, 2);
    for (const e of data.events) {
      assert.strictEqual(e.hook_event_name, "SessionStart");
    }
  });

  it("GET /api/events?session_id=s2&event_type=Stop filters by both", async () => {
    const data = await getJson(`http://127.0.0.1:${port}/api/events?session_id=s2&event_type=Stop`);
    assert.strictEqual(data.events.length, 1);
    assert.strictEqual(data.events[0].session_id, "s2");
    assert.strictEqual(data.events[0].hook_event_name, "Stop");
  });

  it("GET /api/sessions returns session summaries", async () => {
    const data = await getJson(`http://127.0.0.1:${port}/api/sessions`);
    assert.strictEqual(data.sessions.length, 2);
    // sorted by last_ts desc, so s2 first
    assert.strictEqual(data.sessions[0].session_id, "s2");
    assert.strictEqual(data.sessions[0].count, 3);
    assert.strictEqual(data.sessions[1].session_id, "s1");
    assert.strictEqual(data.sessions[1].count, 3);
  });

  it("GET / returns HTML", async () => {
    const { statusCode, body } = await getRaw(`http://127.0.0.1:${port}/`);
    assert.strictEqual(statusCode, 200);
    assert.ok(body.includes("ccmanager"));
  });
});
