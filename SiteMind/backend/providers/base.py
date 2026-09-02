"""
SiteMind — AI Provider Abstraction Layer
Defines the AIProvider interface that all AI backends must implement.
This abstraction makes it trivial to swap Gemini for OpenAI, Ollama, etc.
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator


class AIProvider(ABC):
    """
    Abstract base class for AI providers.

    All AI interactions go through this interface, ensuring that:
    - Business logic never imports provider-specific SDKs directly
    - Swapping providers requires only creating a new subclass
    - Testing can use mock providers easily
    """

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """
        Generate an embedding vector for the given text (document chunk).

        Args:
            text: Input text to embed.

        Returns:
            List of floats representing the embedding vector.
        """
        ...

    @abstractmethod
    async def embed_query(self, query: str) -> list[float]:
        """
        Generate an embedding vector for a search query.

        Args:
            query: Input user query/question to embed.

        Returns:
            List of floats representing the embedding vector.
        """
        ...

    @abstractmethod
    async def chat_stream(
        self,
        system_prompt: str,
        user_message: str,
    ) -> AsyncIterator[str]:
        """
        Stream a chat response token by token.

        Args:
            system_prompt: Instructions for the model's behavior.
            user_message: The user's question with injected context.

        Yields:
            String tokens/chunks as they arrive from the model.
        """
        ...

    @abstractmethod
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for a batch of texts efficiently.

        Args:
            texts: List of input texts.

        Returns:
            List of embedding vectors, one per input text.
        """
        ...
