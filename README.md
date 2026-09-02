# Intel Hub

Intel Hub is a unified local workspace that brings together three intelligence and RAG tools under a single launchpad:

1. **Chat with Website (SiteMind)** - Crawl and index a website, then ask questions about its content using retrieval-augmented generation with source citations.
2. **Chat with Documents (Signal)** - Upload PDFs, DOCX, TXT, CSV, or XLSX files and query them using browser-based RAG and multi-hop reasoning.
3. **NCRP Dashboard** - A telecom intelligence dashboard for exploring case data, hierarchies, drill-downs, and related information.

The project includes a lightweight Python orchestrator that starts the required services on separate ports and opens the Intel Hub landing page automatically.

---

## Project Structure

```text
Final Code Files By Devesh I4C/
|
├── hub/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── orchestrator.py
│   └── README.md
|
├── SiteMind/
│   ├── backend/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── crawler/
│   │   ├── extractor/
│   │   ├── chunker/
│   │   ├── indexer/
│   │   ├── vectorstore/
│   │   ├── providers/
│   │   ├── chat/
│   │   └── api/
│   └── frontend/
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
|
├── docparser/
│   ├── index.html
│   ├── server.js
│   ├── css/
│   ├── js/
│   └── data/
|
└── NCRP/
    ├── src/
    ├── package.json
    └── ...
```

---

## Core Features

### 1. Intel Hub

The Hub acts as the central launchpad for all three applications.

- Single entry point for the complete project
- Separate ports for each application to avoid conflicts
- Service status indicators
- Opens the main dashboard automatically
- Starts and stops child services together
- Displays service logs with clear service prefixes
- Skips services whose required dependencies are missing instead of immediately terminating the entire launcher

### 2. SiteMind

SiteMind provides website-based RAG.

- Crawls websites using Playwright
- Extracts useful page content using Trafilatura and BeautifulSoup
- Splits content into semantic chunks
- Generates vector embeddings using Google's Gemini embedding model
- Stores vectors using Qdrant
- Uses Gemini for question answering
- Streams responses using Server-Sent Events
- Provides source-page citations
- Supports re-indexing and deleting an existing index

The default crawler configuration supports up to 100 pages with a maximum crawl depth of 5.

### 3. Signal Document RAG

Signal is a browser-based document intelligence workspace.

Supported formats:

- PDF
- DOCX
- TXT
- CSV
- XLSX

Processing includes:

- Document parsing
- Text extraction
- Chunking
- Embedding
- In-browser similarity search
- Gemini-powered reasoning
- Source-aware responses
- Multi-hop reasoning for questions that require connecting information across documents

The application also includes named Gemini API-key storage through its local Node.js server.

### 4. NCRP Dashboard

The NCRP application provides a dedicated intelligence dashboard built with React and TanStack tooling.

It is designed for:

- Telecom intelligence workflows
- Case-data exploration
- Hierarchical views
- Drill-down analysis
- Dashboard-based investigation

---

## Architecture

```text
                         Intel Hub
                       localhost:3000
                             |
          +------------------+------------------+
          |                  |                  |
          v                  v                  v
      SiteMind            Signal             NCRP
          |                  |                  |
          |                  |                  |
   +------+-----+            |             React/TanStack
   |            |             |
 Backend     Frontend      Node server
 :8000         :5173         :8010
   |
   +--> Website crawler
   +--> Content extraction
   +--> Chunking
   +--> Gemini embeddings
   +--> Qdrant
   +--> Gemini chat
```

---

## Technology Stack

| Component | Technology |
|---|---|
| Hub | Python, HTML, CSS, JavaScript |
| Orchestration | Python `subprocess` |
| Website frontend | React, TypeScript, Vite, TailwindCSS |
| Website backend | Python, FastAPI |
| Website crawling | Playwright |
| Website extraction | Trafilatura, BeautifulSoup |
| Website embeddings | Gemini |
| Website vector database | Qdrant |
| Website chat | Gemini |
| Document frontend | HTML, CSS, JavaScript |
| Document parsing | PDF.js, Mammoth.js, PapaParse, SheetJS |
| Document embeddings | Gemini |
| Document reasoning | Gemini |
| Document server | Plain Node.js |
| NCRP frontend | React, TypeScript, TanStack, Vite |
| Streaming | Server-Sent Events |

---

## Requirements

Install the following before running the complete project:

- Windows, Linux, or macOS
- Python 3.10+
- Node.js 18+
- npm
- Google Gemini API key

For SiteMind, Playwright Chromium must also be installed.

---

## Installation

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd "Final Code Files By Devesh I4C"
```

### 2. Set up SiteMind backend

```bash
cd SiteMind/backend
```

Create the environment file:

```bash
copy .env.example .env
```

On Linux/macOS:

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Install Playwright Chromium:

```bash
playwright install chromium
```

### 3. Set up SiteMind frontend

```bash
cd ../frontend
npm install
```

### 4. Set up NCRP

```bash
cd ../../NCRP
npm install
```

The document application does not require an npm dependency installation because its parser dependencies are already included as browser-side vendor files.

---

## Running the Complete Project

The recommended way to run the project is through the Hub orchestrator.

From the `hub` directory:

```bash
cd hub
python orchestrator.py
```

The orchestrator starts the following services:

| Service | Port | Address |
|---|---:|---|
| Intel Hub | 3000 | http://localhost:3000 |
| SiteMind Backend | 8000 | http://localhost:8000 |
| SiteMind Frontend | 5173 | http://localhost:5173 |
| Signal Document RAG | 8010 | http://localhost:8010 |
| NCRP Dashboard | 8080 | http://localhost:8080 |

The browser automatically opens:

```text
http://localhost:3000
```

From the Hub, select the required workspace.

To stop all services:

```text
Ctrl + C
```

The orchestrator attempts to terminate all child processes before exiting.

---

## Running Services Individually

### SiteMind Backend

```bash
cd SiteMind/backend
python main.py
```

### SiteMind Frontend

```bash
cd SiteMind/frontend
npm run dev
```

### Signal

```bash
cd docparser
node server.js
```

You can then open:

```text
http://localhost:8010
```

when running through the orchestrator.

### NCRP

```bash
cd NCRP
npm run dev -- --port 8080
```

---

## SiteMind API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/index` | Start website indexing |
| GET | `/index/status` | Get indexing progress |
| DELETE | `/index` | Delete the current index |
| GET | `/website` | Get indexed website metadata |
| POST | `/chat` | Send a RAG question and stream the response |
| GET | `/health` | Backend health check |

---

## Signal Workflow

The document workspace follows this flow:

```text
Upload Documents
       |
       v
Parse Files
       |
       v
Extract Text
       |
       v
Create Chunks
       |
       v
Generate Embeddings
       |
       v
Build In-Browser Index
       |
       v
Ask Questions
       |
       v
Retrieve Relevant Evidence
       |
       v
Gemini Reasoning
       |
       v
Cited Answer
```

Signal supports up to 20 documents in a session.

---

## SiteMind RAG Workflow

```text
Website URL
    |
    v
Playwright Crawler
    |
    v
Content Extraction
    |
    v
Text Chunking
    |
    v
Gemini Embeddings
    |
    v
Qdrant Vector Store
    |
    v
User Question
    |
    v
Similarity Retrieval
    |
    v
Gemini 2.5 Flash
    |
    v
Streaming Answer + Sources
```

---

## Configuration

SiteMind configuration is stored in:

```text
SiteMind/backend/.env
```

Important settings include:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API authentication |
| `GEMINI_CHAT_MODEL` | Model used for chat |
| `GEMINI_EMBEDDING_MODEL` | Model used for embeddings |
| `CRAWLER_MAX_PAGES` | Maximum pages crawled |
| `CRAWLER_MAX_DEPTH` | Maximum crawl depth |
| `CRAWLER_CONCURRENCY` | Number of concurrent crawler tasks |
| `CHUNK_SIZE` | Chunk size |
| `CHUNK_OVERLAP` | Chunk overlap |
| `TOP_K_RESULTS` | Number of retrieved chunks |
| `QDRANT_MODE` | Qdrant storage mode |

---

## API Key Storage

Signal can store named Gemini API keys locally through:

```text
docparser/data/keys.json
```

The local Node.js server provides endpoints for saving, listing, and deleting named keys.

For security, do not commit real API keys to a public GitHub repository.

Before publishing the repository, make sure that any file containing real credentials is excluded from Git.

---

## Troubleshooting

### SiteMind does not start

Check that:

```text
SiteMind/backend/.env
```

exists and contains a valid Gemini API key.

Also verify:

```bash
pip install -r requirements.txt
playwright install chromium
```

### SiteMind frontend does not start

Run:

```bash
cd SiteMind/frontend
npm install
```

Then restart the orchestrator.

### NCRP does not start

Run:

```bash
cd NCRP
npm install
```

Then restart:

```bash
python hub/orchestrator.py
```

### A port is already in use

The default ports are:

```text
3000   Hub
8000   SiteMind Backend
5173   SiteMind Frontend
8010   Signal
8080   NCRP
```

Stop the process occupying the conflicting port or update the corresponding configuration in `hub/orchestrator.py`.

### A workspace shows as unavailable

Check the terminal running `orchestrator.py`. Each service prefixes its output with its service name, making it easier to identify which application failed.

---

## Security Notes

- Never commit Gemini API keys to GitHub.
- Keep `.env` files out of version control.
- Treat locally stored API keys as sensitive credentials.
- This project is intended to run locally unless additional production security measures are added.
- Review crawler permissions and target websites before indexing external content.
- Do not expose the local API servers directly to the public internet without appropriate authentication and security controls.

---

## Development

Each application is independently structured, so components can be developed or replaced without rewriting the entire project.

The Hub is intentionally lightweight and only coordinates the individual applications. SiteMind and Signal can also be run independently when required.

---

## Project Purpose

This project combines website intelligence, document intelligence, and telecom intelligence into one unified local workspace.

The architecture separates the individual tools while providing a common launch interface, making it easier to demonstrate, test, and extend the complete intelligence platform.

---

## License

This project was developed for the Indian Cybercrime Coordination Centre (I4C) as part of a two-month internship.

The code and associated materials were created during the internship period for project development, demonstration, and evaluation purposes. Ownership, usage, distribution, and modification rights are subject to the policies and requirements of I4C and the organization under which the internship was conducted.

The project should not be redistributed, commercialized, or presented as an official I4C product without appropriate authorization.


