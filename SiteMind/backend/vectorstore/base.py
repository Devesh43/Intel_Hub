"""
SiteMind — Vector Store Abstraction Layer
Defines the VectorStore interface for all vector database backends.
Swapping Qdrant for Pinecone/Weaviate/pgvector requires only a new subclass.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class SearchResult:
    """A single result returned by a vector similarity search."""
    text: str
    page_title: str
    page_url: str
    score: float
    metadata: dict


class VectorStore(ABC):
    """
    Abstract base class for vector database backends.
    All chunk storage and retrieval goes through this interface.
    """

    @abstractmethod
    async def upsert(
        self,
        collection_name: str,
        vectors: list[list[float]],
        payloads: list[dict],
        ids: Optional[list[str]] = None,
    ) -> None:
        """
        Insert or update vectors with associated payloads.

        Args:
            collection_name: Target collection/index name.
            vectors:         List of embedding vectors.
            payloads:        List of metadata dicts (one per vector).
            ids:             Optional list of unique IDs (auto-generated if None).
        """
        ...

    @abstractmethod
    async def query(
        self,
        collection_name: str,
        query_vector: list[float],
        top_k: int = 6,
    ) -> list[SearchResult]:
        """
        Find the top_k most similar vectors.

        Args:
            collection_name: Target collection/index name.
            query_vector:    The query embedding vector.
            top_k:           Number of results to return.

        Returns:
            List of SearchResult ordered by similarity (highest first).
        """
        ...

    @abstractmethod
    async def delete_collection(self, collection_name: str) -> None:
        """Delete an entire collection and all its vectors."""
        ...

    @abstractmethod
    async def collection_exists(self, collection_name: str) -> bool:
        """Return True if the collection exists."""
        ...

    @abstractmethod
    async def get_collection_info(self, collection_name: str) -> Optional[dict]:
        """Return metadata about a collection, or None if it doesn't exist."""
        ...
