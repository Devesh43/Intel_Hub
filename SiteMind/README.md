# SiteMind 🧠

> **Chat with any website using AI** — A production-quality RAG chatbot powered by Gemini 2.5 Flash

SiteMind crawls any website, indexes its content into a vector database, and lets you chat with it through a beautiful ChatGPT-style interface. Answers are grounded exclusively in the indexed website content — no hallucinations.

---

## Features

- 🕷️ **Smart Crawler** — Playwright-based async BFS crawl (up to 100 pages, depth 5)
- 📄 **Content Extraction** — Trafilatura + BeautifulSoup for clean text extraction
- 🔢 **Semantic Chunking** — 800-char chunks with 150-char overlap
- 🧬 **Vector Embeddings** — Gemini `text-embedding-004`
- 🗃️ **Vector Database** — Qdrant (in-memory, no Docker required)
- 💬 **Streaming Chat** — Gemini 2.5 Flash with SSE streaming
- 📎 **Source Citations** — Every answer links back to exact source pages
- 🎨 **Premium UI** — Dark-mode ChatGPT-style interface

---

## Quick Start

### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 2. Backend Setup

```bash
cd backend

# Copy and fill in your API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

# Start the backend
python main.py
# → Backend running at http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → Frontend running at http://localhost:5173
```

### 4. Open in browser

Go to **http://localhost:5173**, paste any URL, and click **Index Website**.

---

## Architecture

```
SiteMind/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── config/settings.py       # Env-based config
│   ├── providers/
│   │   ├── base.py              # AIProvider ABC
│   │   └── gemini.py            # GeminiProvider
│   ├── vectorstore/
│   │   ├── base.py              # VectorStore ABC
│   │   └── qdrant_store.py      # Qdrant implementation
│   ├── crawler/playwright_crawler.py
│   ├── extractor/content_extractor.py
│   ├── chunker/text_chunker.py
│   ├── indexer/indexer.py       # Full pipeline orchestrator
│   ├── chat/chat_service.py     # RAG pipeline
│   └── api/routes/              # FastAPI routers
└── frontend/
    └── src/
        ├── components/          # React components
        ├── hooks/               # useIndexing, useChat
        ├── services/api.ts      # Backend API client
        └── pages/Home.tsx
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/index` | Start indexing a URL |
| GET | `/index/status` | Poll indexing progress |
| DELETE | `/index` | Delete the index |
| GET | `/website` | Get indexed website metadata |
| POST | `/chat` | Stream a RAG response (SSE) |
| GET | `/health` | Health check |

---

## Configuration

All settings live in `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | **Required** |
| `GEMINI_CHAT_MODEL` | `gemini-2.5-flash` | Chat model |
| `GEMINI_EMBEDDING_MODEL` | `text-embedding-004` | Embedding model |
| `CRAWLER_MAX_PAGES` | `100` | Max pages per crawl |
| `CRAWLER_MAX_DEPTH` | `5` | Max crawl depth |
| `CRAWLER_CONCURRENCY` | `5` | Parallel page fetches |
| `CHUNK_SIZE` | `800` | Characters per chunk |
| `CHUNK_OVERLAP` | `150` | Overlap between chunks |
| `TOP_K_RESULTS` | `6` | Chunks retrieved per query |
| `QDRANT_MODE` | `memory` | `memory` or `local` |

---

## Extending the AI Provider

Adding a new AI provider (e.g., OpenAI) requires only creating a new class:

```python
from providers.base import AIProvider

class OpenAIProvider(AIProvider):
    async def embed(self, text: str) -> list[float]: ...
    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...
    async def chat_stream(self, system_prompt: str, user_message: str): ...
```

Then swap it in `main.py` — zero changes to business logic.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | Python + FastAPI |
| Crawler | Playwright |
| Extraction | Trafilatura + BeautifulSoup |
| Embeddings | Gemini text-embedding-004 |
| Chat | Gemini 2.5 Flash |
| Vector DB | Qdrant (in-memory) |
| Streaming | Server-Sent Events (SSE) |
