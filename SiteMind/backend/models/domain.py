"""
SiteMind — Domain Models
Core dataclasses used throughout the application.
"""
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import time


class IndexState(str, Enum):
    """Lifecycle states of the indexing pipeline."""
    IDLE = "idle"
    CRAWLING = "crawling"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    SAVING = "saving"
    DONE = "done"
    ERROR = "error"


@dataclass
class Page:
    """A single crawled web page."""
    url: str
    title: str
    content: str               # Extracted clean text
    depth: int = 0


@dataclass
class Chunk:
    """A text chunk derived from a Page, ready for embedding."""
    text: str
    page_url: str
    page_title: str
    chunk_index: int
    website_url: str           # Root URL of the indexed site
    metadata: dict = field(default_factory=dict)


@dataclass
class IndexedWebsite:
    """Metadata about the currently indexed website."""
    url: str
    title: str
    total_pages: int
    total_chunks: int
    indexed_at: float = field(default_factory=time.time)


@dataclass
class IndexStatus:
    """
    Live status of an ongoing or completed indexing job.
    Updated in-place by the Indexer and polled by the API.
    """
    state: IndexState = IndexState.IDLE
    message: str = ""
    progress: float = 0.0        # 0–100
    pages_crawled: int = 0
    pages_total: int = 0
    chunks_created: int = 0
    error: Optional[str] = None
    website: Optional[IndexedWebsite] = None

    def reset(self) -> None:
        self.state = IndexState.IDLE
        self.message = ""
        self.progress = 0.0
        self.pages_crawled = 0
        self.pages_total = 0
        self.chunks_created = 0
        self.error = None
        self.website = None

    def update(
        self,
        state: IndexState,
        message: str,
        progress: float,
    ) -> None:
        self.state = state
        self.message = message
        self.progress = progress


@dataclass
class ChatSource:
    """A source citation returned alongside a chat answer."""
    title: str
    url: str


@dataclass
class ChatResponse:
    """A complete (non-streaming) chat response."""
    answer: str
    sources: list[ChatSource]
