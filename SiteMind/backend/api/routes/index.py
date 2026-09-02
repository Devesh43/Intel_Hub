"""
SiteMind — Index API Routes
POST   /index         — Start indexing a website
GET    /index/status  — Poll indexing progress
DELETE /index         — Delete the indexed website
"""
import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request

from api.schemas import IndexRequest, IndexStatusResponse, MessageResponse
from indexer import site_registry
from models.domain import IndexState
from utils.url_utils import is_valid_url, get_domain, get_collection_name

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/index", tags=["Index"])

_BUSY_STATES = (
    IndexState.CRAWLING,
    IndexState.EXTRACTING,
    IndexState.CHUNKING,
    IndexState.EMBEDDING,
    IndexState.SAVING,
)


@router.post("", response_model=MessageResponse)
async def start_indexing(body: IndexRequest, request: Request):
    """
    Start the indexing pipeline for the given URL.
    Runs as a background asyncio task so the API returns immediately.

    If body.force is False and this domain was already indexed before,
    the pipeline reuses the cached index instantly (no crawl/embed calls).
    """
    status = request.app.state.index_status
    indexer = request.app.state.indexer

    if status.state in _BUSY_STATES:
        raise HTTPException(
            status_code=409,
            detail="Indexing is already in progress. Please wait for it to finish.",
        )

    if not is_valid_url(body.url):
        raise HTTPException(status_code=400, detail="Invalid URL provided.")

    status.reset()
    status.update(
        state=IndexState.CRAWLING,
        message="Starting crawler and discovering pages...",
        progress=1.0,
    )

    asyncio.create_task(indexer.index(body.url, force=body.force))

    logger.info("Indexing started for: %s (force=%s)", body.url, body.force)
    return MessageResponse(message="Indexing started.")


@router.get("/status", response_model=IndexStatusResponse)
async def get_index_status(request: Request):
    """Return the current indexing progress and state."""
    status = request.app.state.index_status
    return IndexStatusResponse(
        state=status.state.value,
        message=status.message,
        progress=status.progress,
        pages_crawled=status.pages_crawled,
        pages_total=status.pages_total,
        chunks_created=status.chunks_created,
        error=status.error,
    )


@router.delete("", response_model=MessageResponse)
async def delete_index(request: Request):
    """Delete the currently active indexed website and reset state."""
    status = request.app.state.index_status
    store = request.app.state.vector_store

    if status.state in _BUSY_STATES:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete while indexing is in progress.",
        )

    if status.website is not None:
        domain = get_domain(status.website.url)
        collection_name = get_collection_name(status.website.url)
        await store.delete_collection(collection_name)
        site_registry.remove_entry(domain)

    status.reset()

    logger.info("Index deleted")
    return MessageResponse(message="Index deleted successfully.")