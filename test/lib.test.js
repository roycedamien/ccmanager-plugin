import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { safeJsonParse, appendEvent } from "../hooks/lib.js";

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    const result = safeJsonParse('{"a":1}');
    assert.deepStrictEqual(result, { a: 1 });
  });

  it("returns _raw on invalid JSON", () => {
    const result = safeJsonParse("not json");
    assert.deepStrictEqual(result, { _raw: "not json" });
  });

  it("handles empty string", () => {
    const result = safeJsonParse("");
    assert.ok(result._raw === "");
  });
});

describe("appendEvent", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ccmanager-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates log dir and writes event", () => {
    const event = { ts: "2026-01-01T00:00:00Z", hook_event_name: "Test" };
    appendEvent(tmpDir, event);

    const logFile = path.join(tmpDir, ".claude", "ccmanager", "events.jsonl");
    assert.ok(fs.existsSync(logFile));

    const lines = fs.readFileSync(logFile, "utf8").trim().split("\n");
    assert.strictEqual(lines.length, 1);
    assert.deepStrictEqual(JSON.parse(lines[0]), event);
  });

  it("appends multiple events", () => {
    appendEvent(tmpDir, { n: 1 });
    appendEvent(tmpDir, { n: 2 });

    const logFile = path.join(tmpDir, ".claude", "ccmanager", "events.jsonl");
    const lines = fs.readFileSync(logFile, "utf8").trim().split("\n");
    assert.strictEqual(lines.length, 2);
    assert.strictEqual(JSON.parse(lines[0]).n, 1);
    assert.strictEqual(JSON.parse(lines[1]).n, 2);
  });
});
