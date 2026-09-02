/* =========================================================
   SIGNAL — Multi-Document RAG Console
   Runs entirely client-side. Calls the Gemini API directly.
========================================================= */

// ---------- CONFIG ----------
const CONFIG = {
  MAX_FILES: 20,
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  EMBED_MODEL: "gemini-embedding-001",
  GEN_MODEL: "gemini-3.6-flash",
  EMBED_BATCH_SIZE: 10,
  TOP_K: 12,
  API_BASE: "https://generativelanguage.googleapis.com/v1beta",
};

// ---------- STATE ----------
const state = {
  apiKey: "",
  files: [],       // {id, file, name, ext, size}
  documents: [],   // {name, text}
  chunks: [],      // {id, text, document, chunkIndex, embedding}
  ready: false,
  embeddingCache: new Map(), // chunk id -> vector, survives a failed/retried ingest
};

// ---------- DOM SHORTCUTS ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

pdfjsLib.GlobalWorkerOptions.workerSrc = "js/vendor/pdf.worker.min.js";

/* =========================================================
   SCREEN NAVIGATION
========================================================= */
function goToScreen(name) {
  $$(".screen").forEach((s) => (s.dataset.active = "false"));
  $(`#screen-${name}`).dataset.active = "true";

  const chipMap = { key: 1, upload: 2, chat: 3 };
  const active = chipMap[name];
  [1, 2, 3].forEach((n) => {
    const chip = $(`#stepChip${n}`);
    if (n < active) chip.dataset.state = "done";
    else if (n === active) chip.dataset.state = "active";
    else chip.dataset.state = "idle";
  });
}

/* =========================================================
   HERO VISUAL (signature element — a small "convergence"
   node graph, echoing the archive's own theme)
========================================================= */
function renderHeroVisual() {
  const w = 420, h = 280;
  const nodes = [
    [60, 60], [210, 40], [360, 70], [90, 150], [230, 140],
    [370, 160], [50, 230], [200, 240], [340, 225],
  ];
  const edges = [[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[3,6],[4,7],[5,8],[6,7],[7,8],[1,3],[4,8]];
  let svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs>
    <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--signal)" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="var(--signal)" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
  edges.forEach(([a, b], i) => {
    const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--border-bright)" stroke-width="1">
      <animate attributeName="stroke" values="var(--border-bright);var(--signal);var(--border-bright)"
        dur="${4 + (i % 5)}s" begin="${i * 0.4}s" repeatCount="indefinite" />
    </line>`;
  });
  nodes.forEach(([x, y], i) => {
    const r = i % 3 === 0 ? 5 : 3.2;
    svg += `<circle cx="${x}" cy="${y}" r="${r + 10}" fill="url(#nodeGlow)" opacity="0.35"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 4 === 0 ? "var(--amber)" : "var(--signal)"}">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="${3 + (i % 4)}s" begin="${i * 0.3}s" repeatCount="indefinite"/>
    </circle>`;
  });
  svg += `</svg>`;
  $("#heroSvgHost").innerHTML = svg;
}
renderHeroVisual();

/* =========================================================
   SCREEN 1 — API KEY
========================================================= */
const apiKeyInput = $("#apiKeyInput");
const keyStatus = $("#keyStatus");
const connectBtn = $("#connectBtn");

$("#toggleKeyVisibility").addEventListener("click", () => {
  const btn = $("#toggleKeyVisibility");
  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text"; btn.textContent = "HIDE";
  } else {
    apiKeyInput.type = "password"; btn.textContent = "SHOW";
  }
});

apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") connectBtn.click();
});

connectBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    setKeyStatus("Enter a key to continue.", "error");
    return;
  }
  setKeyStatus("Verifying key against the Gemini API…", "loading");
  connectBtn.disabled = true;
  try {
    const res = await fetch(`${CONFIG.API_BASE}/models?key=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(res.status === 400 || res.status === 403 ? "Invalid key" : `HTTP ${res.status}`);
    state.apiKey = key;
    setKeyStatus("Connected. Signal acquired.", "ok");
    setTimeout(() => goToScreen("upload"), 500);
  } catch (err) {
    setKeyStatus(`Could not verify key (${err.message}). Check the key and try again.`, "error");
  } finally {
    connectBtn.disabled = false;
  }
});

function setKeyStatus(msg, stateName) {
  keyStatus.textContent = msg;
  keyStatus.dataset.state = stateName;
}

/* =========================================================
   SAVED API KEYS (named, stored server-side in data/keys.json
   via server.js — so you don't have to re-paste a key every
   time you restart the session)
========================================================= */
const savedKeysBlock = $("#savedKeysBlock");
const savedKeysList = $("#savedKeysList");
const saveKeyName = $("#saveKeyName");
const saveKeyBtn = $("#saveKeyBtn");
const saveKeyStatus = $("#saveKeyStatus");

function setSaveKeyStatus(msg, stateName) {
  saveKeyStatus.textContent = msg || "";
  saveKeyStatus.dataset.state = stateName || "";
}

async function fetchSavedKeys() {
  try {
    const res = await fetch("/api/keys");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.keys) ? data.keys : [];
  } catch (err) {
    // Backend not reachable (e.g. opened via file:// instead of node server.js) —
    // fail quietly, the manual key input still works.
    return null;
  }
}

function renderSavedKeys(keys) {
  savedKeysList.innerHTML = "";

  if (keys === null) {
    savedKeysBlock.hidden = true;
    return;
  }

  if (keys.length === 0) {
    savedKeysBlock.hidden = true;
    return;
  }

  savedKeysBlock.hidden = false;
  keys
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .forEach((entry) => {
      const chip = document.createElement("div");
      chip.className = "key-chip";

      const useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "key-chip-use";
      useBtn.textContent = entry.name;
      useBtn.title = "Fill in this saved key";
      useBtn.addEventListener("click", () => {
        apiKeyInput.value = entry.key;
        saveKeyName.value = entry.name;
        setKeyStatus(`Loaded saved key "${entry.name}". Click Verify & Connect.`, "");
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "key-chip-del";
      delBtn.textContent = "×";
      delBtn.title = `Delete "${entry.name}"`;
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete the saved key "${entry.name}"?`)) return;
        try {
          const res = await fetch(`/api/keys/${encodeURIComponent(entry.name)}`, { method: "DELETE" });
          const data = await res.json();
          renderSavedKeys(Array.isArray(data.keys) ? data.keys : []);
        } catch (err) {
          setSaveKeyStatus("Could not delete key (server not reachable).", "error");
        }
      });

      chip.appendChild(useBtn);
      chip.appendChild(delBtn);
      savedKeysList.appendChild(chip);
    });
}

async function refreshSavedKeys() {
  const keys = await fetchSavedKeys();
  renderSavedKeys(keys);
}

saveKeyBtn.addEventListener("click", async () => {
  const name = saveKeyName.value.trim();
  const key = apiKeyInput.value.trim();
  if (!key) {
    setSaveKeyStatus("Enter a key above first.", "error");
    return;
  }
  if (!name) {
    setSaveKeyStatus("Give this key a name to save it.", "error");
    return;
  }
  saveKeyBtn.disabled = true;
  try {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, key }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderSavedKeys(Array.isArray(data.keys) ? data.keys : []);
    setSaveKeyStatus(`Saved as "${name}".`, "ok");
  } catch (err) {
    setSaveKeyStatus("Could not save key — is node server.js running?", "error");
  } finally {
    saveKeyBtn.disabled = false;
  }
});

saveKeyName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveKeyBtn.click();
  }
});

refreshSavedKeys();

/* =========================================================
   SCREEN 2 — UPLOAD
========================================================= */
const dropzone = $("#dropzone");
const fileInput = $("#fileInput");
const fileListEl = $("#fileList");
const fileCountEl = $("#fileCount");
const ingestBtn = $("#ingestBtn");

dropzone.addEventListener("click", () => fileInput.click());
["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("drag-over"); })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("drag-over"); })
);
dropzone.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
fileInput.addEventListener("change", (e) => addFiles(e.target.files));

const SUPPORTED_EXT = ["pdf", "docx", "txt", "csv", "xlsx"];

function addFiles(fileListInput) {
  const incoming = Array.from(fileListInput);
  for (const file of incoming) {
    if (state.files.length >= CONFIG.MAX_FILES) break;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!SUPPORTED_EXT.includes(ext)) continue;
    if (state.files.some((f) => f.name === file.name && f.size === file.size)) continue;
    state.files.push({ id: crypto.randomUUID(), file, name: file.name, ext, size: file.size });
  }
  renderFileList();
}

function renderFileList() {
  fileListEl.innerHTML = "";
  state.files.forEach((f) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.innerHTML = `
      <span class="f-ext">${f.ext}</span>
      <span class="f-name">${escapeHtml(f.name)}</span>
      <span class="f-size">${formatBytes(f.size)}</span>
      <button class="f-remove" data-id="${f.id}" aria-label="Remove">×</button>
    `;
    fileListEl.appendChild(row);
  });
  fileCountEl.textContent = state.files.length;
  ingestBtn.disabled = state.files.length === 0;

  $$(".f-remove").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      state.files = state.files.filter((f) => f.id !== id);
      renderFileList();
    })
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---- File extraction ---- */
async function extractText(fileEntry) {
  const { file, ext } = fileEntry;
  if (ext === "pdf") {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(" ") + "\n";
    }
    return text;
  }
  if (ext === "docx") {
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }
  if (ext === "txt") {
    return await file.text();
  }
  if (ext === "csv") {
    const raw = await file.text();
    const parsed = Papa.parse(raw.trim(), { skipEmptyLines: true });
    return parsed.data.map((row) => row.join(" | ")).join("\n");
  }
  if (ext === "xlsx") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    let text = "";
    wb.SheetNames.forEach((sheetName) => {
      const sheet = wb.Sheets[sheetName];
      text += `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}\n\n`;
    });
    return text;
  }
  return "";
}

/* ---- Chunking (mirrors the reference notebook: 1000 chars, 200 overlap) ---- */
function chunkText(text, size = CONFIG.CHUNK_SIZE, overlap = CONFIG.CHUNK_OVERLAP) {
  const clean = text.replace(/\u0000/g, " ").split(/\s+/).join(" ").trim();
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = start + size;
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start += size - overlap;
  }
  return chunks;
}

/* ---- Progress logging ---- */
const progressPanel = $("#progressPanel");
const progressLog = $("#progressLog");
const progressFill = $("#progressFill");

function logLine(msg, cls = "") {
  const div = document.createElement("div");
  if (cls) div.className = cls;
  div.textContent = msg;
  progressLog.appendChild(div);
  progressLog.scrollTop = progressLog.scrollHeight;
}
function setProgress(pct) {
  progressFill.style.width = `${Math.min(100, pct)}%`;
}

/* ---- Gemini embedding calls ---- */
async function embedBatch(texts, taskType, onRetry) {
  const url = `${CONFIG.API_BASE}/models/${CONFIG.EMBED_MODEL}:batchEmbedContents?key=${encodeURIComponent(state.apiKey)}`;
  const body = {
    requests: texts.map((t) => ({
      model: `models/${CONFIG.EMBED_MODEL}`,
      content: { parts: [{ text: t }] },
      taskType,
    })),
  };
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, { onRetry });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding request failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.embeddings.map((e) => e.values);
}

async function embedSingle(text, taskType) {
  const [vec] = await embedBatch([text], taskType);
  return vec;
}

function cosineSim(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // Gemini embeddings are already normalized, so dot product == cosine similarity
}

/* ---- Build the index ---- */
ingestBtn.addEventListener("click", buildIndex);

async function buildIndex() {
  ingestBtn.disabled = true;
  progressPanel.hidden = false;
  progressLog.innerHTML = "";
  setProgress(0);

  try {
    // 1. Extract
    logLine(`Parsing ${state.files.length} document(s)…`);
    state.documents = [];
    for (const f of state.files) {
      const text = await extractText(f);
      if (text && text.trim()) {
        state.documents.push({ name: f.name, text });
        logLine(`✓ ${f.name} — ${text.trim().length.toLocaleString()} characters`, "log-ok");
      } else {
        logLine(`⚠ ${f.name} — no extractable text, skipped`);
      }
      setProgress((state.documents.length / state.files.length) * 15);
    }

    // 2. Chunk
    logLine(`Splitting into overlapping chunks (${CONFIG.CHUNK_SIZE}/${CONFIG.CHUNK_OVERLAP})…`);
    state.chunks = [];
    state.documents.forEach((doc) => {
      const pieces = chunkText(doc.text);
      pieces.forEach((text, idx) => {
        state.chunks.push({ id: `${doc.name}::${idx}`, text, document: doc.name, chunkIndex: idx, embedding: null });
      });
    });
    logLine(`✓ Created ${state.chunks.length} chunks across ${state.documents.length} documents`, "log-ok");
    setProgress(20);

    // 3. Embed in batches (skip chunks already embedded on a previous attempt —
    //    this is what makes a rate-limited run resumable instead of wasting quota)
    logLine(`Embedding chunks with ${CONFIG.EMBED_MODEL}…`);
    state.chunks.forEach((c) => {
      if (state.embeddingCache.has(c.id)) c.embedding = state.embeddingCache.get(c.id);
    });
    const pending = state.chunks.filter((c) => !c.embedding);
    const alreadyDone = state.chunks.length - pending.length;
    if (alreadyDone > 0) {
      logLine(`  ${alreadyDone} chunk(s) already embedded from a previous attempt — resuming`, "log-ok");
    }

    const batchSize = CONFIG.EMBED_BATCH_SIZE;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      const vectors = await embedBatch(
        batch.map((c) => c.text),
        "RETRIEVAL_DOCUMENT",
        (attempt, maxRetries, delayMs, status) => {
          logLine(`  rate limited (HTTP ${status}) — retry ${attempt}/${maxRetries} in ${Math.round(delayMs / 1000)}s…`, "log-warn");
        }
      );
      batch.forEach((c, j) => {
        c.embedding = vectors[j];
        state.embeddingCache.set(c.id, vectors[j]);
      });
      const donePct = alreadyDone + Math.min(pending.length, i + batchSize);
      setProgress(20 + (donePct / state.chunks.length) * 75);
      logLine(`  embedded ${donePct}/${state.chunks.length}`);
      await sleep(120); // gentle pacing between batches
    }

    logLine(`✓ Index built. Ready for questions.`, "log-ok");
    setProgress(100);
    state.ready = true;

    renderDocNodeList();
    renderSuggestions();
    setTimeout(() => goToScreen("chat"), 700);
  } catch (err) {
    logLine(`✗ Error: ${err.message}`);
    logLine(`Already-embedded chunks are cached — click "Resume indexing" to continue instead of starting over.`, "log-warn");
    ingestBtn.textContent = "Resume indexing →";
    ingestBtn.disabled = false;
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ---- Resilient fetch: retries on 429/500/503/504 with exponential
   backoff + jitter, honoring a Retry-After header when Google sends one.
   This is what actually fixes rate-limit failures on big documents —
   parsing/chunking never touch the network, only embedding + generation do. ---- */
async function fetchWithRetry(url, options, { maxRetries = 6, onRetry } = {}) {
  let attempt = 0;
  for (;;) {
    const res = await fetch(url, options);
    if (res.ok) return res;

    const retryable = res.status === 429 || res.status === 500 || res.status === 503 || res.status === 504;
    if (!retryable || attempt >= maxRetries) return res;

    const retryAfterHeader = res.headers.get("Retry-After");
    let delayMs;
    if (retryAfterHeader && !isNaN(Number(retryAfterHeader))) {
      delayMs = Number(retryAfterHeader) * 1000;
    } else {
      const base = Math.min(30000, 1000 * 2 ** attempt);
      delayMs = base + Math.random() * 400; // jitter
    }
    if (onRetry) onRetry(attempt + 1, maxRetries, delayMs, res.status);
    await sleep(delayMs);
    attempt++;
  }
}

/* =========================================================
   SCREEN 3 — CHAT
========================================================= */
const chatLog = $("#chatLog");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const chatEmpty = $("#chatEmpty");
const multiHopToggle = $("#multiHopToggle");
const docNodeList = $("#docNodeList");
const suggestionRow = $("#suggestionRow");

function renderDocNodeList() {
  docNodeList.innerHTML = "";
  state.documents.forEach((doc) => {
    const el = document.createElement("div");
    el.className = "doc-node";
    el.dataset.doc = doc.name;
    el.innerHTML = `<span class="node-dot"></span><span class="node-name">${escapeHtml(doc.name)}</span>`;
    docNodeList.appendChild(el);
  });
}

function litUpDocs(names) {
  $$(".doc-node").forEach((el) => {
    el.classList.toggle("lit", names.has(el.dataset.doc));
  });
}

const SAMPLE_QUESTIONS = [
  "What are the main topics across these documents?",
  "Summarize the key entities and how they relate.",
  "Are there any contradictions between documents?",
];
function renderSuggestions() {
  suggestionRow.innerHTML = "";
  SAMPLE_QUESTIONS.forEach((q) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "suggestion-chip";
    chip.textContent = q;
    chip.addEventListener("click", () => {
      chatInput.value = q;
      chatForm.requestSubmit();
    });
    suggestionRow.appendChild(chip);
  });
}

$("#resetBtn").addEventListener("click", () => {
  if (!confirm("Start a new session? This clears the current archive and chat.")) return;
  location.reload();
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = chatInput.value.trim();
  if (!question || !state.ready) return;
  chatInput.value = "";
  chatEmpty.style.display = "none";
  addMessage("user", escapeHtml(question));
  const traceEl = addThinkingTrace();

  try {
    let answer, sourcesUsed;
    if (multiHopToggle.checked) {
      ({ answer, sourcesUsed } = await multiHopAnswer(question, traceEl));
    } else {
      ({ answer, sourcesUsed } = await simpleAnswer(question, traceEl));
    }
    traceEl.remove();
    addMessage("assistant", renderAnswerMarkdown(answer), sourcesUsed);
    litUpDocs(sourcesUsed);
  } catch (err) {
    traceEl.remove();
    addMessage("assistant", `⚠ ${escapeHtml(err.message || "Something went wrong reaching Gemini.")}`);
  }
});

function addMessage(role, htmlContent, sourcesUsed) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = htmlContent;
  wrap.appendChild(bubble);
  if (role === "assistant" && sourcesUsed && sourcesUsed.size) {
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    meta.textContent = `sources · ${Array.from(sourcesUsed).join(", ")}`;
    wrap.appendChild(meta);
  }
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
}

function addThinkingTrace() {
  const wrap = document.createElement("div");
  wrap.className = "msg assistant";
  wrap.innerHTML = `<div class="thinking-trace"><div class="tt-line">retrieving evidence<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span></div></div>`;
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
}
function traceLog(traceEl, msg) {
  const box = traceEl.querySelector(".thinking-trace");
  const line = document.createElement("div");
  line.className = "tt-line";
  line.textContent = msg;
  box.insertBefore(line, box.lastElementChild);
  chatLog.scrollTop = chatLog.scrollHeight;
}

/* ---- Retrieval ---- */
async function retrieve(query, topK = CONFIG.TOP_K) {
  const qVec = await embedSingle(query, "RETRIEVAL_QUERY");
  const scored = state.chunks.map((c) => ({ ...c, score: cosineSim(qVec, c.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function buildContext(results) {
  return results
    .map(
      (r, i) => `==============================
SOURCE ${i + 1}
Document: ${r.document}
Chunk: ${r.chunkIndex}
==============================
${r.text}`
    )
    .join("\n\n");
}

const RAG_INSTRUCTIONS = `INSTRUCTIONS:
1. Answer the user's question using the retrieved evidence.
2. You may need to combine information from multiple documents. Do this carefully.
3. Do not assume information from one document applies to another unless the evidence supports that connection.
4. If the answer requires reasoning, explicitly explain the reasoning.
5. Distinguish between information directly stated in the documents and conclusions inferred by connecting information.
6. If multiple documents provide complementary information, combine them into one coherent answer.
7. If documents contradict each other, point out the contradiction instead of silently choosing one.
8. Never invent facts that are not supported by the evidence.
9. If the retrieved evidence is insufficient to answer the question, clearly say so.
10. Cite sources in this format: [Document Name]
11. For questions requiring information from multiple documents, cite every relevant document.
12. Give a clear, natural answer rather than simply repeating the retrieved passages. Use markdown **bold** for key terms and short paragraphs.`;

async function callGemini(prompt) {
  const url = `${CONFIG.API_BASE}/models/${CONFIG.GEN_MODEL}:generateContent?key=${encodeURIComponent(state.apiKey)}`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("");
}

async function simpleAnswer(question, traceEl) {
  traceLog(traceEl, `embedding query…`);
  const results = await retrieve(question, CONFIG.TOP_K);
  traceLog(traceEl, `retrieved ${results.length} chunks from ${new Set(results.map((r) => r.document)).size} documents`);
  const context = buildContext(results);
  const prompt = `You are an advanced multi-document RAG reasoning assistant.

USER QUESTION:
${question}

RETRIEVED EVIDENCE:
${context}

${RAG_INSTRUCTIONS}

ANSWER:`;
  traceLog(traceEl, `reasoning over evidence…`);
  const answer = await callGemini(prompt);
  return { answer, sourcesUsed: new Set(results.map((r) => r.document)) };
}

async function planResearch(question) {
  const prompt = `You are the research planner for a multi-document RAG system.

The user has asked:
${question}

The answer may require information from multiple documents. Break the question into 2 to 5 independent research questions that should be searched separately.

IMPORTANT:
- Each research question should target a specific piece of evidence.
- Make the questions useful for semantic document retrieval.
- Do not answer the questions.
- Return ONLY valid JSON, a plain array of strings, no markdown fences.

USER QUESTION:
${question}`;
  const raw = (await callGemini(prompt)).trim().replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (_) {}
  return [question];
}

async function multiHopAnswer(question, traceEl) {
  traceLog(traceEl, `planning research questions…`);
  const subQuestions = await planResearch(question);
  subQuestions.forEach((q) => traceLog(traceEl, `  · ${q}`));

  const seen = new Map();
  for (const sq of subQuestions) {
    const results = await retrieve(sq, 6);
    results.forEach((r) => {
      const key = r.id;
      if (!seen.has(key) || seen.get(key).score < r.score) seen.set(key, r);
    });
  }
  const finalResults = Array.from(seen.values()).sort((a, b) => b.score - a.score);
  traceLog(traceEl, `gathered ${finalResults.length} unique evidence chunks from ${new Set(finalResults.map((r) => r.document)).size} documents`);

  const context = buildContext(finalResults);
  const prompt = `You are an advanced multi-document reasoning assistant, answering using evidence retrieved through MULTI-HOP SEARCH.

ORIGINAL QUESTION:
${question}

RESEARCH QUESTIONS USED:
${subQuestions.map((q) => "- " + q).join("\n")}

RETRIEVED EVIDENCE:
${context}

${RAG_INSTRUCTIONS}
13. When making an inferred connection between documents, explicitly explain the chain of reasoning.

FINAL ANSWER:`;
  traceLog(traceEl, `reasoning across sources…`);
  const answer = await callGemini(prompt);
  return { answer, sourcesUsed: new Set(finalResults.map((r) => r.document)) };
}

/* ---- Lightweight markdown-ish renderer for answers ---- */
function renderAnswerMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\[\]]{2,80}?)\]/g, '<span class="cite">$1</span>');
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html
    .split(/\n{2,}/)
    .map((para) => {
      const lines = para.split("\n").filter((l) => l.trim());
      if (lines.every((l) => /^[-*]\s+/.test(l.trim())) && lines.length) {
        return "<ul>" + lines.map((l) => `<li>${l.trim().replace(/^[-*]\s+/, "")}</li>`).join("") + "</ul>";
      }
      return `<p>${lines.join("<br/>")}</p>`;
    })
    .join("");
  return html;
}
