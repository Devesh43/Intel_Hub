# Intel Hub — merged launcher

Four files here: `index.html`, `style.css`, `app.js` (the landing page)
and `orchestrator.py` (starts everything).

## 1. Folder layout

Put this `hub` folder next to your three projects, like this:

```
project-hub/
  hub/                  <- these 4 files
  SiteMind/
    backend/            <- FastAPI app (main.py, requirements.txt, .env)
    frontend/            <- Vite/React app (package.json)
  docparser/             <- node server.js, index.html, css/, js/
  NCRP/                  <- TanStack Start app (package.json)
```

If your folder names differ, edit the paths at the top of
`orchestrator.py` (the `CONFIG` block) — nothing else needs to change.

## 2. One-time setup (per project, do this first)

**SiteMind backend**
```
cd SiteMind/backend
cp .env.example .env      # then edit .env and add your GEMINI_API_KEY
pip install -r requirements.txt
playwright install chromium
```

**SiteMind frontend**
```
cd SiteMind/frontend
npm install
```

**docparser** — no install needed, it's plain Node.

**NCRP**
```
cd NCRP
npm install
```

## 3. Run everything

```
cd hub
python orchestrator.py
```

This starts:
| Service              | Port | URL                      |
|-----------------------|------|---------------------------|
| Hub landing page      | 3000 | http://localhost:3000     |
| SiteMind backend (API)| 8000 | http://localhost:8000     |
| SiteMind frontend      | 5173 | http://localhost:5173     |
| docparser (Signal)     | 8010 | http://localhost:8010     |
| NCRP dashboard          | 4000 | http://localhost:4000     |

Your browser opens automatically to the hub. Click a card to open that
workspace in a new tab. Status dots turn green once each service
responds. Press `Ctrl+C` in the terminal to stop all of them at once.

## Notes

- Ports were picked to avoid collisions — SiteMind's frontend has
  `http://localhost:8000` hardcoded as its API proxy target, so that
  port is fixed. docparser defaults to 8000 too, so the orchestrator
  moves it to 8010 via the `PORT` env var it already supports.
- If a card's dot stays red, check the terminal running
  `orchestrator.py` — it prefixes every log line with the service name
  (e.g. `[SITEMIND-BE]`) so you can see exactly what failed.
- The orchestrator won't try to start a service whose dependencies
  aren't installed yet (missing `node_modules`, missing `.env`) — it
  logs a warning and skips it instead of crashing.
