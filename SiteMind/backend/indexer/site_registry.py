"""
SiteMind — Site Registry
Tracks every website that has been indexed, persisted to a small JSON file
on disk (backend/site_registry.json). This lets the app:
  - Restore the last-active site on backend restart (no re-scrape needed)
  - Skip re-crawling/re-embedding a site that's already indexed
  - Keep a history of every site indexed so far (see GET /website/history)
"""
import json
import logging
import os
import threading
from typing import Optional

logger = logging.getLogger(__name__)

_LOCK = threading.Lock()
_REGISTRY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site_registry.json")
_REGISTRY_PATH = os.path.normpath(_REGISTRY_PATH)


def _read() -> dict:
    if not os.path.exists(_REGISTRY_PATH):
        return {"sites": {}, "active_domain": None}
    try:
        with open(_REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning("Failed to read site registry (%s), starting fresh", e)
        return {"sites": {}, "active_domain": None}


def _write(data: dict) -> None:
    try:
        with open(_REGISTRY_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.warning("Failed to write site registry: %s", e)


def get_entry(domain: str) -> Optional[dict]:
    """Look up a previously indexed site by domain (e.g. 'www.trai.gov.in')."""
    with _LOCK:
        data = _read()
        return data["sites"].get(domain)


def upsert_entry(domain: str, entry: dict, set_active: bool = True) -> None:
    """Save/update a site's metadata. Marks it as the active site by default."""
    with _LOCK:
        data = _read()
        data["sites"][domain] = entry
        if set_active:
            data["active_domain"] = domain
        _write(data)


def remove_entry(domain: str) -> None:
    """Remove a site from the registry (used by Delete Index)."""
    with _LOCK:
        data = _read()
        data["sites"].pop(domain, None)
        if data.get("active_domain") == domain:
            data["active_domain"] = None
        _write(data)


def get_active() -> Optional[dict]:
    """Return the metadata of whichever site is currently marked active, if any."""
    with _LOCK:
        data = _read()
        active_domain = data.get("active_domain")
        if not active_domain:
            return None
        return data["sites"].get(active_domain)


def list_all() -> list[dict]:
    """Return every site ever indexed (the 'history')."""
    with _LOCK:
        data = _read()
        return list(data["sites"].values())