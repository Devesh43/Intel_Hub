"""
SiteMind — Qdrant Vector Store Implementation
Uses qdrant-client in-memory mode for V1 (no Docker required).
Switch to persistent mode by setting QDRANT_MODE=local in .env.
"""
import logging
import uuid
from typing import Optional

from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

from vectorstore.base import VectorStore, SearchResult
from config.settings import settings

logger = logging.getLogger(__name__)

# Gemini text-embedding-004 outputs 768-dimensional vectors
EMBEDDING_DIMENSION = 768


class QdrantStore(VectorStore):
    """
    Qdrant-backed vector store.

    V1: Runs fully in-memory (no Docker, no persistence).
    Future: Set QDRANT_MODE=local + QDRANT_PATH to persist data on disk.
    """

    def __init__(self) -> None:
        if settings.qdrant_mode == "memory":
            self._client = QdrantClient(":memory:")
            logger.info("QdrantStore initialized in-memory mode")
        else:
            self._client = QdrantClient(path=settings.qdrant_path)
            logger.info("QdrantStore initialized with path=%s", settings.qdrant_path)

    def _ensure_collection(self, collection_name: str, vector_size: int = 3072) -> None:
        """Create collection if it doesn't already exist."""
        existing = [c.name for c in self._client.get_collections().collections]
        if collection_name not in existing:
            self._client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            )
            logger.debug("Created collection: %s (size=%d)", collection_name, vector_size)

    async def upsert(
        self,
        collection_name: str,
        vectors: list[list[float]],
        payloads: list[dict],
        ids: Optional[list[str]] = None,
    ) -> None:
        """Insert vectors and their payloads into the collection."""
        if not vectors:
            return

        vector_size = len(vectors[0])
        self._ensure_collection(collection_name, vector_size=vector_size)

        if ids is None:
            ids = [str(uuid.uuid4()) for _ in vectors]

        points = [
            PointStruct(
                id=str(uid),
                vector=vector,
                payload=payload,
            )
            for uid, vector, payload in zip(ids, vectors, payloads)
        ]

        self._client.upsert(collection_name=collection_name, points=points)
        logger.debug("Upserted %d points into '%s'", len(points), collection_name)

    async def query(
        self,
        collection_name: str,
        query_vector: list[float],
        top_k: int = 6,
    ) -> list[SearchResult]:
        """Search for the top_k most similar chunks."""
        if not await self.collection_exists(collection_name):
            return []

        if hasattr(self._client, "query_points"):
            response = self._client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=top_k,
                with_payload=True,
            )
            results = response.points
        else:
            results = self._client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=top_k,
                with_payload=True,
            )

        return [
            SearchResult(
                text=r.payload.get("text", "") if r.payload else "",
                page_title=r.payload.get("page_title", "") if r.payload else "",
                page_url=r.payload.get("page_url", "") if r.payload else "",
                score=r.score,
                metadata=r.payload or {},
            )
            for r in results
        ]

    async def delete_collection(self, collection_name: str) -> None:
        """Delete a collection and all its data."""
        if await self.collection_exists(collection_name):
            self._client.delete_collection(collection_name)
            logger.info("Deleted collection: %s", collection_name)

    async def collection_exists(self, collection_name: str) -> bool:
        """Check if a collection exists."""
        existing = [c.name for c in self._client.get_collections().collections]
        return collection_name in existing

    async def get_collection_info(self, collection_name: str) -> Optional[dict]:
        """Return info about a collection."""
        if not await self.collection_exists(collection_name):
            return None
        info = self._client.get_collection(collection_name)
        return {
            "name": collection_name,
            "vectors_count": info.vectors_count,
            "points_count": info.points_count,
        }
