"""
SiteMind — Application Settings
Loads configuration from .env file using Pydantic BaseSettings.
Single source of truth for all configuration values.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Gemini API
    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-flash-latest"
    gemini_embedding_model: str = "gemini-embedding-001"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Crawler
    crawler_max_pages: int = 100
    crawler_max_depth: int = 5
    crawler_concurrency: int = 5
    crawler_timeout: int = 30

    # Chunking
    chunk_size: int = 800
    chunk_overlap: int = 150

    # Embedding limits (V1: cap chunks to avoid free-tier quota exhaustion)
    # Gemini free tier limit: 100 items per minute for embed_content.
    max_chunks_v1: int = 90

    # Vector search
    top_k_results: int = 6

    # Qdrant
    qdrant_mode: Literal["memory", "local"] = "memory"
    qdrant_path: str = "./qdrant_storage"

    @field_validator("gemini_api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        # Allow empty during startup; validated at runtime when used
        return v


# Global singleton
settings = Settings()
