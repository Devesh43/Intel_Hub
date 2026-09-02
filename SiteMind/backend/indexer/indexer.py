"""
SiteMind — Indexing Pipeline Orchestrator
Coordinates: crawl → extract → chunk → embed → store

Runs as a background asyncio task.
Updates a shared IndexStatus singleton that the API polls.

Each domain gets its own permanent Qdrant collection (see
utils.url_utils.get_collection_name), and every indexed site is recorded in
indexer.site_registry (a small JSON file on disk). This means:
  - Indexing a URL you've already indexed is a near-instant cache hit
    (zero crawl/embed API calls) unless force=True is passed.
  - Indexing a new URL never wipes out a previously indexed site.
  - The app can restore your last-active site after a backend restart.
"""
import asyncio
import logging
import time
import uuid
from typing import Optional

from crawler.playwright_crawler import PlaywrightCrawler
from extractor.content_extractor import ContentExtractor
from chunker.text_chunker import TextChunker
from providers.base import AIProvider
from vectorstore.base import VectorStore
from models.domain import (
    IndexStatus,
    IndexState,
    IndexedWebsite,
    Chunk,
)
from config.settings import settings
from utils.url_utils import get_domain, get_collection_name
from indexer import site_registry

logger = logging.getLogger(__name__)

# Legacy fixed collection name — no longer used for new indexes, kept only
# so old code referencing it doesn't break on import.
COLLECTION_NAME = "sitemind_website"


class Indexer:
    """
    Full indexing pipeline: crawl → extract → chunk → embed → store.

    The Indexer is stateless; all state lives in IndexStatus.
    This makes it easy to add cancellation, queuing, or multiple websites later.
    """

    def __init__(
        self,
        ai_provider: AIProvider,
        vector_store: VectorStore,
        status: IndexStatus,
    ) -> None:
        self._ai = ai_provider
        self._store = vector_store
        self._status = status
        self._crawler = PlaywrightCrawler()
        self._extractor = ContentExtractor()
        self._chunker = TextChunker()

    async def index(self, url: str, force: bool = False) -> None:
        """
        Run the full indexing pipeline for a given URL.
        Updates self._status throughout.

        If `force` is False (default) and this domain was already indexed
        previously, the pipeline is skipped entirely and the cached result
        is reused — no crawl, no embedding, no API calls.
        """
        try:
            await self._run_pipeline(url, force=force)
        except BaseException as e:
            import traceback
            tb = traceback.format_exc()
            logger.error("Indexing pipeline failed for %s: %s\n%s", url, e, tb)
            self._status.state = IndexState.ERROR
            self._status.error = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
            self._status.message = f"Indexing failed: {self._status.error}"
            self._status.progress = 0.0
            # Re-raise CancelledError so asyncio can clean up properly
            if isinstance(e, asyncio.CancelledError):
                raise

    async def _run_pipeline(self, url: str, force: bool = False) -> None:
        """Internal pipeline — raises on unrecoverable error."""

        domain = get_domain(url)
        collection_name = get_collection_name(url)

        # ── Step 0: Cache hit — reuse a previously indexed site ─────────────
        if not force:
            cached = site_registry.get_entry(domain)
            if cached and await self._store.collection_exists(cached.get("collection_name", collection_name)):
                logger.info("Cache hit for %s — reusing existing index, no API calls made.", domain)
                self._status.pages_crawled = cached["total_pages"]
                self._status.pages_total = cached["total_pages"]
                self._status.chunks_created = cached["total_chunks"]
                self._status.website = IndexedWebsite(
                    url=cached["url"],
                    title=cached["title"],
                    total_pages=cached["total_pages"],
                    total_chunks=cached["total_chunks"],
                    indexed_at=cached["indexed_at"],
                )
                self._status.update(
                    state=IndexState.DONE,
                    message=f"Loaded previously indexed site ({domain}) — no re-scraping needed.",
                    progress=100.0,
                )
                site_registry.upsert_entry(domain, cached, set_active=True)
                return

        # ── Step 1: Crawl ─────────────────────────────────────────────────
        self._status.update(
            state=IndexState.CRAWLING,
            message="Starting crawler and discovering pages...",
            progress=5.0,
        )

        async def crawl_progress(done: int, total: int) -> None:
            pct = 5.0 + (done / max(total, 1)) * 30.0
            self._status.pages_crawled = done
            self._status.pages_total = total
            self._status.progress = min(pct, 35.0)
            self._status.message = f"Crawling... ({done} pages found)"

        pages = await self._crawler.crawl(url, progress_callback=crawl_progress)

        if not pages:
            raise RuntimeError(
                "No pages could be crawled from this URL. "
                "The website may be blocking bots or have no accessible content."
            )

        self._status.pages_crawled = len(pages)
        self._status.pages_total = len(pages)
        logger.info("Crawled %d pages from %s", len(pages), url)

        # ── Step 2: Extract ───────────────────────────────────────────────
        self._status.update(
            state=IndexState.EXTRACTING,
            message=f"Extracting content from {len(pages)} pages...",
            progress=38.0,
        )
        extracted_pages = []
        for page in pages:
            try:
                extracted = self._extractor.extract(page)
                if extracted.content and len(extracted.content) > 50:
                    extracted_pages.append(extracted)
            except Exception as e:
                logger.warning("Extraction failed for %s: %s", page.url, e)

        if not extracted_pages:
            raise RuntimeError("No readable content could be extracted from the crawled pages.")

        logger.info("%d pages with extractable content", len(extracted_pages))

        # ── Step 3: Chunk ─────────────────────────────────────────────────
        self._status.update(
            state=IndexState.CHUNKING,
            message="Splitting content into searchable chunks...",
            progress=50.0,
        )
        all_chunks = self._chunker.chunk_pages(extracted_pages, website_url=url)

        if not all_chunks:
            raise RuntimeError("No text chunks could be created. The website content may be too short.")

        logger.info("Created %d total chunks", len(all_chunks))

        # ── Step 3b: Cap chunks for V1 ────────────────────────────────────
        limit = settings.max_chunks_v1
        if limit and len(all_chunks) > limit:
            logger.warning(
                "Chunk limit reached: capping at %d (total was %d). "
                "Only the first %d chunks will be indexed.",
                limit, len(all_chunks), limit,
            )
            self._status.message = (
                f"Chunk limit: indexing first {limit} of {len(all_chunks)} chunks "
                f"(set MAX_CHUNKS_V1 in .env to increase)."
            )
            all_chunks = all_chunks[:limit]

        # Deduplicate by text (preserve first occurrence, keep order)
        seen_texts: set[str] = set()
        unique_chunks: list[Chunk] = []
        for chunk in all_chunks:
            if chunk.text not in seen_texts:
                seen_texts.add(chunk.text)
                unique_chunks.append(chunk)
        if len(unique_chunks) < len(all_chunks):
            logger.info("Deduplication: %d → %d unique chunks", len(all_chunks), len(unique_chunks))
        all_chunks = unique_chunks

        self._status.chunks_created = len(all_chunks)

        # ── Step 4: Delete existing index for THIS domain only ─────────────
        # (other previously-indexed sites live in their own collections and
        # are left untouched)
        await self._store.delete_collection(collection_name)

        # ── Step 5: Embed ─────────────────────────────────────────────────
        self._status.update(
            state=IndexState.EMBEDDING,
            message=f"Creating embeddings for {len(all_chunks)} chunks (1 API call)...",
            progress=55.0,
        )
        all_embeddings = await self._embed_chunks(all_chunks)

        # ── Step 6: Save ──────────────────────────────────────────────────
        self._status.update(
            state=IndexState.SAVING,
            message="Saving knowledge to vector database...",
            progress=90.0,
        )
        await self._save_to_store(all_chunks, all_embeddings, collection_name)

        # ── Done ──────────────────────────────────────────────────────────
        root_title = extracted_pages[0].title if extracted_pages else get_domain(url)
        self._status.website = IndexedWebsite(
            url=url,
            title=root_title,
            total_pages=len(extracted_pages),
            total_chunks=len(all_chunks),
        )
        self._status.update(
            state=IndexState.DONE,
            message=f"Done! Indexed {len(extracted_pages)} pages and {len(all_chunks)} chunks.",
            progress=100.0,
        )
        logger.info("Indexing complete for %s", url)

        # ── Step 7: Remember this site for next time ────────────────────
        site_registry.upsert_entry(
            domain,
            {
                "url": url,
                "domain": domain,
                "title": root_title,
                "total_pages": len(extracted_pages),
                "total_chunks": len(all_chunks),
                "indexed_at": self._status.website.indexed_at,
                "collection_name": collection_name,
            },
            set_active=True,
        )

    async def _embed_chunks(self, chunks: list[Chunk]) -> list[list[float]]:
        """
        Embed ALL chunks in a SINGLE API call to Gemini (gemini-embedding-001
        accepts up to 250 input texts per request, well above our 90-chunk cap).

        On quota exhaustion (429) we parse the retry_delay from the error,
        wait exactly that long, then retry — up to 3 total attempts. This
        model's free-tier quota has been observed to be intermittently flaky
        even on fresh projects, so a few retries meaningfully help.
        """
        import re

        texts = [c.text for c in chunks]
        n = len(texts)

        async def _call_embed() -> list[list[float]]:
            # Single request: our chunk cap (settings.max_chunks_v1) is well
            # under the model's 250-text-per-request limit.
            return await self._ai.embed_batch(texts)

        def _parse_retry_delay(err_str: str) -> float:
            """Extract retry delay seconds from a 429 error message."""
            match = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', err_str)
            if match:
                return float(match.group(1))
            return 65.0  # Conservative fallback

        self._status.message = f"Embedding {n} chunks in one API call..."
        logger.info("Embedding %d chunks in one API call", n)

        MAX_ATTEMPTS = 3
        last_error: Optional[Exception] = None

        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                embeddings = await _call_embed()
                logger.info("Embedding succeeded on attempt %d: %d vectors", attempt, len(embeddings))
                self._status.progress = 88.0
                return embeddings
            except Exception as e:
                last_error = e
                err_str = str(e)
                is_quota = "429" in err_str or "quota" in err_str.lower()

                if not is_quota:
                    # Non-quota error: raise immediately, no point retrying
                    raise RuntimeError(f"Embedding failed: {e}") from e

                if attempt == MAX_ATTEMPTS:
                    break  # fall through to final error handling below

                wait_secs = _parse_retry_delay(err_str)
                logger.warning(
                    "Embedding quota limit hit (attempt %d/%d). Waiting %.0fs, then retrying...",
                    attempt, MAX_ATTEMPTS, wait_secs,
                )
                self._status.message = (
                    f"Embedding quota reached — waiting {wait_secs:.0f}s "
                    f"(attempt {attempt}/{MAX_ATTEMPTS})..."
                )
                await asyncio.sleep(wait_secs)

        # All attempts exhausted
        retry_str = str(last_error)
        is_daily = "day" in retry_str.lower() or "1000" in retry_str
        if is_daily:
            raise RuntimeError(
                "Gemini free-tier daily embedding quota is exhausted. "
                "Please wait until midnight Pacific Time for the quota to reset, "
                "or upgrade to a paid Gemini API plan."
            ) from last_error
        raise RuntimeError(
            f"Embedding failed after {MAX_ATTEMPTS} attempts: {last_error}"
        ) from last_error

    async def _save_to_store(
        self,
        chunks: list[Chunk],
        embeddings: list[list[float]],
        collection_name: str,
    ) -> None:
        """Save all chunks and their embeddings to the vector store."""
        payloads = [
            {
                "text": chunk.text,
                "page_url": chunk.page_url,
                "page_title": chunk.page_title,
                "chunk_index": chunk.chunk_index,
                "website_url": chunk.website_url,
            }
            for chunk in chunks
        ]
        ids = [str(uuid.uuid4()) for _ in chunks]

        await self._store.upsert(
            collection_name=collection_name,
            vectors=embeddings,
            payloads=payloads,
            ids=ids,
        )
        logger.info("Saved %d chunks to vector store (%s)", len(chunks), collection_name)