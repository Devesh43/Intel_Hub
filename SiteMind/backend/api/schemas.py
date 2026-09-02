"""
SiteMind — API Request/Response Schemas
Pydantic models for all API endpoints.
"""
from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, List
from models.domain import IndexState


# ── Index Endpoint ─────────────────────────────────────────────────────────────

class IndexRequest(BaseModel):
    url: str
    # If False (default) and this domain was already indexed before, the
    # backend reuses the cached index instantly instead of re-scraping.
    # The "Re-index" button sends force=True to always do a fresh crawl.
    force: bool = False

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class IndexStatusResponse(BaseModel):
    state: str
    message: str
    progress: float
    pages_crawled: int
    pages_total: int
    chunks_created: int
    error: Optional[str] = None


# ── Website Endpoint ───────────────────────────────────────────────────────────

class WebsiteMetadata(BaseModel):
    url: str
    title: str
    total_pages: int
    total_chunks: int
    indexed_at: float


class WebsiteResponse(BaseModel):
    indexed: bool
    website: Optional[WebsiteMetadata] = None


# ── Chat Endpoint ──────────────────────────────────────────────────────────────

class ChatMessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[ChatMessageItem]] = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Question cannot be empty")
        if len(v) > 2000:
            raise ValueError("Question is too long (max 2000 characters)")
        return v


class SourceItem(BaseModel):
    title: str
    url: str


# ── Generic ────────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None