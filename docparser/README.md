# Signal — Multi-Document RAG Console

A self-contained, browser-based RAG (Retrieval-Augmented Generation) app.
Upload up to **20 documents**, ask questions, and get answers grounded in
your files with citations — powered directly by the Gemini API.

No backend, no build step, no Python. Everything (parsing, chunking,
embedding, retrieval, and reasoning) runs in your browser tab. Your API
key is only ever sent from your browser straight to Google's API.

## Running it

**Easiest:** just double-click `index.html` to open it in your browser.

**More reliable (recommended):** some browsers restrict local file access
for security. If the app doesn't load correctly from a double-click, serve
it from a tiny local server instead:

```bash
cd signal-rag-console
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

or, with Node installed:

```bash
npx serve .
```

## Using it

1. **Connect** — paste a Gemini API key (get one free at
   [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))
   and click Verify & Connect.
2. **Archive** — drag in 1–20 files (PDF, DOCX, TXT, CSV, XLSX). Click
   **Build Index** to parse, chunk, and embed them.
3. **Query** — ask questions in the chat. Toggle **Deep reasoning** on for
   multi-hop questions that require connecting facts across several
   documents (the app will plan sub-questions, retrieve evidence for each,
   then reason over everything together).

## What's under the hood

- **Parsing**: `pdf.js` (PDF), `mammoth.js` (DOCX), `PapaParse` (CSV),
  `SheetJS` (XLSX), native `File.text()` (TXT).
- **Chunking**: 1000-character chunks with 200-character overlap, same
  scheme as the reference notebook this was built from.
- **Embeddings**: Google's `gemini-embedding-001` model via
  `batchEmbedContents`, with cosine similarity search done in-browser
  (fine at this scale — no vector database needed for a few hundred
  chunks).
- **Reasoning**: `gemini-2.5-flash` via `generateContent`, prompted to
  cite sources, distinguish direct facts from inferred connections, and
  flag contradictions between documents.

## Notes & limits

- Nothing is persisted — refreshing the page clears the archive and chat.
  Rebuild the index if you reload.
- Very large document sets will take longer to embed (the app embeds in
  small batches with a short delay between them to stay within free-tier
  rate limits). Watch the progress log during **Build Index**.
- This is a client-side tool, so your API key lives only in that browser
  tab's memory — it is not written to disk or sent anywhere but Google's
  API.
