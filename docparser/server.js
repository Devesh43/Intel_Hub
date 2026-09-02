/* =========================================================
   SIGNAL — local server
   -----------------------------------------------------------
   Plain Node.js (no npm install needed). Does two things:

   1. Serves the app's static files (index.html, css/, js/)
      so you can just run `node server.js` instead of
      `python3 -m http.server`.

   2. Exposes a tiny JSON API so the browser can save/list/
      delete NAMED API keys to a file on disk
      (./data/keys.json), so you don't have to re-paste your
      key every time you restart the session.

   Nothing here talks to the internet. It only reads/writes
   a local JSON file. Run it with:

       node server.js

   then open http://localhost:8000
========================================================= */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const KEYS_FILE = path.join(DATA_DIR, "keys.json");

// ---------- storage helpers ----------
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(KEYS_FILE)) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify({ keys: [] }, null, 2));
  }
}

function readKeys() {
  ensureStore();
  try {
    const raw = fs.readFileSync(KEYS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.keys)) return [];
    return parsed.keys;
  } catch {
    return [];
  }
}

function writeKeys(keys) {
  ensureStore();
  fs.writeFileSync(KEYS_FILE, JSON.stringify({ keys }, null, 2));
}

// ---------- tiny JSON body reader ----------
function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = "";
    req.on("data", (c) => (chunks += c));
    req.on("end", () => {
      if (!chunks) return resolve({});
      try {
        resolve(JSON.parse(chunks));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// ---------- API routes ----------
async function handleApi(req, res, parsedUrl) {
  const method = req.method;
  const segments = parsedUrl.pathname.split("/").filter(Boolean); // ["api","keys", ...]

  // GET /api/keys — list saved keys (name + key)
  if (method === "GET" && segments.length === 2) {
    return sendJson(res, 200, { keys: readKeys() });
  }

  // POST /api/keys — body: { name, key } — add or overwrite by name
  if (method === "POST" && segments.length === 2) {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }
    const name = (body.name || "").toString().trim();
    const key = (body.key || "").toString().trim();
    if (!name || !key) {
      return sendJson(res, 400, { error: "Both 'name' and 'key' are required" });
    }
    const keys = readKeys();
    const existingIdx = keys.findIndex((k) => k.name === name);
    const entry = { name, key, savedAt: new Date().toISOString() };
    if (existingIdx >= 0) keys[existingIdx] = entry;
    else keys.push(entry);
    writeKeys(keys);
    return sendJson(res, 200, { keys });
  }

  // DELETE /api/keys/<name> — remove a saved key by name
  if (method === "DELETE" && segments.length === 3) {
    const name = decodeURIComponent(segments[2]);
    const keys = readKeys().filter((k) => k.name !== name);
    writeKeys(keys);
    return sendJson(res, 200, { keys });
  }

  return sendJson(res, 404, { error: "Not found" });
}

// ---------- static file serving ----------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveStatic(req, res, parsedUrl) {
  let filePath = decodeURIComponent(parsedUrl.pathname);
  if (filePath === "/") filePath = "/index.html";
  const fullPath = path.normalize(path.join(ROOT, filePath));

  // prevent path traversal outside the project root
  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

// ---------- server ----------
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  if (parsedUrl.pathname.startsWith("/api/")) {
    handleApi(req, res, parsedUrl).catch((err) => {
      sendJson(res, 500, { error: err.message || "Server error" });
    });
    return;
  }

  serveStatic(req, res, parsedUrl);
});

ensureStore();
server.listen(PORT, () => {
  console.log(`Signal is running at http://localhost:${PORT}`);
  console.log(`Saved API keys are stored locally in ${KEYS_FILE}`);
});
