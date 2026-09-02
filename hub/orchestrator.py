#!/usr/bin/env python3
"""
orchestrator.py — Intel Hub launcher

Starts all three projects on separate ports, plus this hub's own landing
page, then opens the landing page in your browser. Ctrl+C stops everything.

    python orchestrator.py

FOLDER LAYOUT THIS SCRIPT EXPECTS
----------------------------------
Put this script (and index.html / style.css / app.js) inside a folder
called `hub`, sitting next to the three projects:

    project-hub/
      hub/                  <- orchestrator.py, index.html, style.css, app.js
      SiteMind/
        backend/            <- FastAPI app (main.py)
        frontend/           <- Vite/React app (package.json)
      docparser/            <- node server.js
      NCRP/                 <- TanStack Start app (package.json)

If your folders are named or placed differently, just edit the four
paths in the CONFIG block below — everything else adapts automatically.
"""

import http.server
import os
import shutil
import signal
import socketserver
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────
# CONFIG — edit these if your folder names/locations differ
# ─────────────────────────────────────────────────────────────────────────

HUB_DIR = Path(__file__).resolve().parent          # this folder (index.html lives here)
ROOT_DIR = HUB_DIR.parent                            # the merged project-hub folder

SITEMIND_DIR = ROOT_DIR / "SiteMind"
SITEMIND_BACKEND_DIR = SITEMIND_DIR / "backend"
SITEMIND_FRONTEND_DIR = SITEMIND_DIR / "frontend"

DOCPARSER_DIR = ROOT_DIR / "docparser"

NCRP_DIR = ROOT_DIR / "NCRP"

# Ports — kept apart so nothing collides. SiteMind's frontend hardcodes a
# proxy to localhost:8000 for its backend, so backend must stay on 8000.
HUB_PORT = 3000
SITEMIND_BACKEND_PORT = 8000
SITEMIND_FRONTEND_PORT = 5173
DOCPARSER_PORT = 8010
NCRP_PORT = 8080

OPEN_BROWSER = True

# ─────────────────────────────────────────────────────────────────────────

NPM = "npm.cmd" if os.name == "nt" else "npm"
PYTHON = sys.executable

processes: list[subprocess.Popen] = []
_lock = threading.Lock()


def log(tag: str, msg: str) -> None:
    print(f"[{tag:^10}] {msg}", flush=True)


def start_process(tag: str, cmd: list[str], cwd: Path, env: dict | None = None) -> subprocess.Popen | None:
    if not cwd.exists():
        log(tag, f"SKIPPED — folder not found: {cwd}")
        return None

    full_env = os.environ.copy()
    if env:
        full_env.update(env)

    log(tag, f"starting: {' '.join(cmd)}  (cwd={cwd})")
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            env=full_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except FileNotFoundError as e:
        log(tag, f"FAILED to launch — is the required tool installed? ({e})")
        return None

    with _lock:
        processes.append(proc)

    def pump():
        for line in proc.stdout:  # type: ignore[union-attr]
            log(tag, line.rstrip())

    threading.Thread(target=pump, daemon=True).start()
    return proc


def start_sitemind_backend():
    venv_python = SITEMIND_BACKEND_DIR / ".venv" / (
        "Scripts/python.exe" if os.name == "nt" else "bin/python"
    )
    py = str(venv_python) if venv_python.exists() else PYTHON

    if not (SITEMIND_BACKEND_DIR / ".env").exists():
        log("SITEMIND-BE", "WARNING: backend/.env not found — copy .env.example to .env and add GEMINI_API_KEY")

    start_process(
        "SITEMIND-BE",
        [py, "main.py"],
        SITEMIND_BACKEND_DIR,
        env={"BACKEND_PORT": str(SITEMIND_BACKEND_PORT), "FRONTEND_URL": f"http://localhost:{SITEMIND_FRONTEND_PORT}"},
    )


def start_sitemind_frontend():
    if not (SITEMIND_FRONTEND_DIR / "node_modules").exists():
        log("SITEMIND-FE", "node_modules missing — run `npm install` inside SiteMind/frontend first. Skipping.")
        return
    start_process(
        "SITEMIND-FE",
        [NPM, "run", "dev", "--", "--port", str(SITEMIND_FRONTEND_PORT), "--strictPort"],
        SITEMIND_FRONTEND_DIR,
    )


def start_docparser():
    node = shutil.which("node")
    if not node:
        log("DOCPARSER", "FAILED — Node.js not found on PATH.")
        return
    start_process(
        "DOCPARSER",
        [node, "server.js"],
        DOCPARSER_DIR,
        env={"PORT": str(DOCPARSER_PORT)},
    )


def start_ncrp():
    if not (NCRP_DIR / "node_modules").exists():
        log("NCRP", "node_modules missing — run `npm install` (or `bun install`) inside NCRP first. Skipping.")
        return
    start_process(
        "NCRP",
        [NPM, "run", "dev", "--", "--port", str(NCRP_PORT), "--strictPort"],
        NCRP_DIR,
    )


def start_hub_page():
    """Serve this folder's index.html/style.css/app.js as a tiny static site."""

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(HUB_DIR), **kwargs)

        def log_message(self, fmt, *args):
            log("HUB", fmt % args)

    class ReusableServer(socketserver.TCPServer):
        allow_reuse_address = True

    httpd = ReusableServer(("0.0.0.0", HUB_PORT), QuietHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    log("HUB", f"landing page ready at http://localhost:{HUB_PORT}")
    return httpd


def shutdown(*_args):
    print()
    log("ORCH", "shutting down all services...")
    with _lock:
        for proc in processes:
            if proc.poll() is None:
                try:
                    proc.terminate()
                except Exception:
                    pass
        time.sleep(1)
        for proc in processes:
            if proc.poll() is None:
                try:
                    proc.kill()
                except Exception:
                    pass
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    log("ORCH", "launching Intel Hub — chat with website / chat with documents / NCRP dashboard")

    start_hub_page()
    start_sitemind_backend()
    start_sitemind_frontend()
    start_docparser()
    start_ncrp()

    log("ORCH", "-" * 60)
    log("ORCH", f"Hub:                http://localhost:{HUB_PORT}")
    log("ORCH", f"Chat with Website:  http://localhost:{SITEMIND_FRONTEND_PORT}  (API on :{SITEMIND_BACKEND_PORT})")
    log("ORCH", f"Chat with Documents: http://localhost:{DOCPARSER_PORT}")
    log("ORCH", f"NCRP Dashboard:     http://localhost:{NCRP_PORT}")
    log("ORCH", "-" * 60)
    log("ORCH", "Press Ctrl+C to stop everything.")

    if OPEN_BROWSER:
        time.sleep(1.5)
        webbrowser.open(f"http://localhost:{HUB_PORT}")

    while True:
        time.sleep(1)


if __name__ == "__main__":
    main()
