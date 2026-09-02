"""
SiteMind — FastAPI Application Entry Point
Wires together all providers, services, and routes.
"""
import sys
import asyncio
import logging

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from models.domain import IndexStatus, IndexedWebsite, IndexState
from providers.gemini import GeminiProvider
from vectorstore.qdrant_store import QdrantStore
from indexer.indexer import Indexer
from indexer import site_registry
from utils.url_utils import get_collection_name
from chat.chat_service import ChatService
from api.routes.index import router as index_router
from api.routes.chat import router as chat_router
from api.routes.website import router as website_router

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── App factory ────────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="SiteMind API",
        description="RAG-powered chatbot for any website",
        version="1.0.0",
    )

    # ── CORS ───────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Shared state (singletons) ───────────────────────────────────────────
    index_status = IndexStatus()
    vector_store = QdrantStore()
    ai_provider = GeminiProvider()
    indexer = Indexer(
        ai_provider=ai_provider,
        vector_store=vector_store,
        status=index_status,
    )
    chat_service = ChatService(
        ai_provider=ai_provider,
        vector_store=vector_store,
    )

    app.state.index_status = index_status
    app.state.vector_store = vector_store
    app.state.ai_provider = ai_provider
    app.state.indexer = indexer
    app.state.chat_service = chat_service

    # ── Routes ─────────────────────────────────────────────────────────────
    app.include_router(index_router)
    app.include_router(chat_router)
    app.include_router(website_router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "version": "1.0.0"}

    @app.on_event("startup")
    async def startup_event():
        loop = asyncio.get_running_loop()
        logger.info("Application started with event loop: %s", type(loop).__name__)

        # Restore the last-active site from disk, if its vectors are still
        # there — so a backend restart never forces a re-scrape.
        try:
            active = site_registry.get_active()
            if active:
                collection_name = active.get("collection_name") or get_collection_name(active["url"])
                if await vector_store.collection_exists(collection_name):
                    index_status.website = IndexedWebsite(
                        url=active["url"],
                        title=active["title"],
                        total_pages=active["total_pages"],
                        total_chunks=active["total_chunks"],
                        indexed_at=active["indexed_at"],
                    )
                    index_status.update(
                        state=IndexState.DONE,
                        message=f"Restored previously indexed site: {active['url']}",
                        progress=100.0,
                    )
                    logger.info("Restored indexed site from disk: %s", active["url"])
                else:
                    logger.info(
                        "Registry pointed to %s but its collection is missing — starting fresh.",
                        active["url"],
                    )
        except Exception as e:
            logger.warning("Could not restore previous index: %s", e)

    logger.info("SiteMind API ready at http://%s:%d", settings.backend_host, settings.backend_port)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.backend_host,
        port=settings.backend_port,
        reload=False,
        loop="none",
        log_level="info",
    )