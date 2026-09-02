"""
SiteMind — Gemini AI Provider
Implements AIProvider using Google Gemini APIs.
Models: gemini-2.5-flash-lite (chat) + text-embedding-004 (embeddings)
"""
import asyncio
import logging
import re
import time
from typing import AsyncIterator

import google.generativeai as genai

from providers.base import AIProvider
from config.settings import settings

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    """
    Google Gemini implementation of AIProvider.

    Uses:
      - text-embedding-004  for vector embeddings
      - gemini-2.5-flash-lite    for streaming chat responses
    """

    def __init__(self) -> None:
        self._chat_model_name = settings.gemini_chat_model
        self._embedding_model_name = settings.gemini_embedding_model
        if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
            genai.configure(api_key=settings.gemini_api_key)
            self._chat_model = genai.GenerativeModel(self._chat_model_name)
            logger.info(
                "GeminiProvider initialized | chat=%s | embed=%s",
                self._chat_model_name,
                self._embedding_model_name,
            )
        else:
            self._chat_model = None
            logger.warning("GEMINI_API_KEY is not configured yet in backend/.env")

    def _ensure_configured(self) -> None:
        key = settings.gemini_api_key
        if not key or key == "your_gemini_api_key_here":
            raise ValueError(
                "GEMINI_API_KEY is missing or invalid in backend/.env. "
                "Please add a valid Gemini API key to backend/.env and restart the server."
            )
        if self._chat_model is None:
            genai.configure(api_key=key)
            self._chat_model = genai.GenerativeModel(self._chat_model_name)

    def _get_embedding_model(self) -> str:
        if self._embedding_model_name.startswith("models/"):
            return self._embedding_model_name
        return f"models/{self._embedding_model_name}"

    async def embed(self, text: str) -> list[float]:
        """Generate a single embedding vector for a document chunk with 429 retry."""
        self._ensure_configured()
        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(
                None,
                lambda: genai.embed_content(
                    model=self._get_embedding_model(),
                    content=text,
                    task_type="retrieval_document",
                ),
            )
            return result["embedding"]
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "quota" in err_str.lower():
                match = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', err_str)
                wait_secs = float(match.group(1)) if match else 5.0
                logger.warning("Embedding 429 quota hit. Waiting %.0fs then retrying...", wait_secs)
                await asyncio.sleep(wait_secs)
                result = await loop.run_in_executor(
                    None,
                    lambda: genai.embed_content(
                        model=self._get_embedding_model(),
                        content=text,
                        task_type="retrieval_document",
                    ),
                )
                return result["embedding"]
            raise e

    async def embed_query(self, query: str) -> list[float]:
        """Generate an embedding vector for a user query using retrieval_query task_type with 429 retry."""
        self._ensure_configured()
        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(
                None,
                lambda: genai.embed_content(
                    model=self._get_embedding_model(),
                    content=query,
                    task_type="retrieval_query",
                ),
            )
            return result["embedding"]
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "quota" in err_str.lower():
                match = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', err_str)
                wait_secs = float(match.group(1)) if match else 5.0
                logger.warning("Query embedding 429 quota hit. Waiting %.0fs then retrying...", wait_secs)
                await asyncio.sleep(wait_secs)
                result = await loop.run_in_executor(
                    None,
                    lambda: genai.embed_content(
                        model=self._get_embedding_model(),
                        content=query,
                        task_type="retrieval_query",
                    ),
                )
                return result["embedding"]
            return await self.embed(query)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.
        Gemini's batch_embed_contents is used for efficiency.
        Falls back to sequential embedding if batch fails.
        """
        self._ensure_configured()
        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(
                None,
                lambda: genai.embed_content(
                    model=self._get_embedding_model(),
                    content=texts,
                    task_type="retrieval_document",
                ),
            )
            # When content is a list, result["embedding"] is a list of lists
            embeddings = result["embedding"]
            if isinstance(embeddings[0], float):
                # Single text returned as flat list — wrap it
                return [embeddings]
            return embeddings
        except Exception as e:
            logger.warning("Batch embed failed (%s), falling back to sequential", e)
            return [await self.embed(t) for t in texts]

    async def chat_stream(
        self,
        system_prompt: str,
        user_message: str,
    ) -> AsyncIterator[str]:
        """
        Stream a chat response using the configured Gemini chat model.
        Yields text chunks as they arrive. Retries once on a 429/quota error,
        honoring the server-suggested retry_delay when present.
        """
        self._ensure_configured()
        loop = asyncio.get_running_loop()

        # Build the full prompt combining system + user context
        full_prompt = f"{system_prompt}\n\n---\n\n{user_message}"

        # Run the blocking stream in a thread executor
        # We collect the streaming response chunks via a queue
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def _run_stream() -> None:
            def _generate():
                return self._chat_model.generate_content(
                    full_prompt,
                    stream=True,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,         # Low temp for factual RAG
                        max_output_tokens=4096,
                    ),
                )

            try:
                try:
                    response = _generate()
                except Exception as e:
                    err_str = str(e)
                    if "429" in err_str or "quota" in err_str.lower():
                        match = re.search(r'retry_delay\s*\{\s*seconds:\s*(\d+)', err_str)
                        wait_secs = float(match.group(1)) if match else 15.0
                        logger.warning(
                            "Chat 429 quota hit. Waiting %.0fs then retrying...", wait_secs
                        )
                        time.sleep(wait_secs)
                        response = _generate()
                    else:
                        raise

                for chunk in response:
                    text_val = None
                    try:
                        text_val = chunk.text
                    except (AttributeError, ValueError):
                        pass
                    if text_val:
                        asyncio.run_coroutine_threadsafe(
                            queue.put(text_val), loop
                        )
                asyncio.run_coroutine_threadsafe(queue.put(None), loop)
            except Exception as e:
                logger.error("Gemini stream error: %s", e)
                asyncio.run_coroutine_threadsafe(
                    queue.put(f"\n\n[Error: {e}]"), loop
                )
                asyncio.run_coroutine_threadsafe(queue.put(None), loop)

        # Start stream in thread pool
        loop.run_in_executor(None, _run_stream)

        # Yield tokens from the queue
        while True:
            token = await queue.get()
            if token is None:
                break
            yield token