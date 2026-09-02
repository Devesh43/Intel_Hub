"""
SiteMind — Website API Routes
GET /website          — Return metadata about the currently indexed website
GET /website/history   — Return every website ever indexed (from disk)
"""
import logging

from fastapi import APIRouter, Request

from api.schemas import WebsiteResponse, WebsiteMetadata
from indexer import site_registry
from models.domain import IndexState

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/website", tags=["Website"])


@router.get("", response_model=WebsiteResponse)
async def get_website(request: Request):
    """
    Return metadata about the currently indexed website.
    Returns indexed=False if no website is indexed.
    """
    status = request.app.state.index_status

    if status.state != IndexState.DONE or status.website is None:
        return WebsiteResponse(indexed=False)

    w = status.website
    return WebsiteResponse(
        indexed=True,
        website=WebsiteMetadata(
            url=w.url,
            title=w.title,
            total_pages=w.total_pages,
            total_chunks=w.total_chunks,
            indexed_at=w.indexed_at,
        ),
    )


@router.get("/history")
async def get_history():
    """
    Return every website that has ever been indexed (persisted on disk),
    regardless of which one is currently active. Useful to confirm nothing
    needs re-scraping, and as a base for a future "switch site" UI.
    """
    return {"sites": site_registry.list_all()}