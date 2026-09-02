"""
Test script for SiteMind RAG pipeline on Python documentation.
"""
import asyncio
import logging

from crawler.playwright_crawler import PlaywrightCrawler
from extractor.content_extractor import ContentExtractor
from chunker.text_chunker import TextChunker
from providers.gemini import GeminiProvider
from vectorstore.qdrant_store import QdrantStore
from indexer.indexer import Indexer
from chat.chat_service import ChatService
from models.domain import IndexStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test():
    url = "https://docs.python.org/3/tutorial/"
    logger.info("Starting test crawl & index for: %s", url)

    status = IndexStatus()
    store = QdrantStore()
    ai = GeminiProvider()
    indexer = Indexer(ai_provider=ai, vector_store=store, status=status)
    chat = ChatService(ai_provider=ai, vector_store=store)

    await indexer.index(url)
    logger.info("Index finished with state: %s | pages=%d | chunks=%d", status.state, status.pages_crawled, status.chunks_created)

    questions = [
        "What is this website about?",
        "What is the difference between a list and a tuple in Python?",
        "How do list comprehensions work in Python?",
    ]

    for q in questions:
        print(f"\n==========================================")
        print(f"QUESTION: {q}")
        print(f"==========================================")
        answer = ""
        sources = []
        async for event in chat.stream_answer(q):
            if event.get("type") == "token":
                answer += event["content"]
            elif event.get("type") == "sources":
                sources = event["sources"]
        print(f"ANSWER:\n{answer}\n")
        print(f"SOURCES: {sources}")

if __name__ == "__main__":
    asyncio.run(test())
