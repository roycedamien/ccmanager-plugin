import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HOST = process.env.CCMANAGER_HOST ?? "127.0.0.1";
const PORT = Number(process.env.CCMANAGER_PORT ?? 7337);

const PROJECT_DIR =
  process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const LOG_FILE = path.join(PROJECT_DIR, ".claude", "ccmanager", "events.jsonl");

const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

/** Read and parse all events from the JSONL log file. */
function readEvents() {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, "utf8").split("\n");
  const events = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      events.push({ _raw: trimmed });
    }
  }
  return events;
}

/** Aggregate events into per-session summaries. */
function buildSessions(events) {
  const map = new Map();
  for (const event of events) {
    const sid = event.session_id ?? "(unknown)";
    if (!map.has(sid)) {
      map.set(sid, { session_id: sid, last_ts: event.ts ?? null, count: 0 });
    }
    const entry = map.get(sid);
    entry.count += 1;
    if (event.ts && (!entry.last_ts || event.ts > entry.last_ts)) {
      entry.last_ts = event.ts;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.last_ts ?? "").localeCompare(a.last_ts ?? "")
  );
}

function sendJson(res, obj, status = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  const contentType = MIME[ext] ?? "application/octet-stream";
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": body.length,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/api/events" && req.method === "GET") {
      const rawLimit = Number(url.searchParams.get("limit"));
      const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 200, 1000);
      const sessionId = url.searchParams.get("session_id");
      const eventType = url.searchParams.get("event_type");

      let all = readEvents();

      if (sessionId) {
        all = all.filter((e) => e.session_id === sessionId);
      }
      if (eventType) {
        all = all.filter((e) => e.hook_event_name === eventType);
      }

      const events = all.slice(-limit);
      sendJson(res, { projectDir: PROJECT_DIR, logFile: LOG_FILE, total: all.length, events });
      return;
    }

    if (pathname === "/api/sessions" && req.method === "GET") {
      const events = readEvents();
      const sessions = buildSessions(events);
      sendJson(res, { sessions });
      return;
    }

    // Serve static files
    if (pathname === "/" || pathname === "/index.html") {
      sendFile(res, path.join(PUBLIC_DIR, "index.html"));
      return;
    }

    // Allow any other file under public/ (path.basename prevents traversal)
    const safeName = path.basename(pathname);
    if (!safeName || safeName === ".") {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }
    const candidate = path.resolve(PUBLIC_DIR, safeName);
    // Ensure we stay inside public dir
    if (!candidate.startsWith(PUBLIC_DIR + path.sep)) {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }
    sendFile(res, candidate);
  } catch (err) {
    try {
      res.writeHead(500);
      res.end("Internal server error");
    } catch {
      // ignore
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ccmanager UI: http://${HOST}:${PORT}`);
  console.log(`Watching log: ${LOG_FILE}`);
});
