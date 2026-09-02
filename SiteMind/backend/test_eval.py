"""
Evaluation Test Suite for SiteMind RAG Pipeline
Runs Level 1 to Level 4 test cases against the Pixar Theory content.
"""
import sys
sys.path.insert(0, ".")
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

async def run_eval():
    url = "https://jonnegroni.com/2013/07/11/the-pixar-theory/"
    print(f"\n=======================================================")
    print(f"  INDEXING TEST TARGET: {url}")
    print(f"=======================================================")

    status = IndexStatus()
    store = QdrantStore()
    ai = GeminiProvider()
    indexer = Indexer(ai_provider=ai, vector_store=store, status=status)
    chat = ChatService(ai_provider=ai, vector_store=store)

    await indexer.index(url)
    print(f"Index Status : {status.state.value}")
    print(f"Pages        : {status.pages_crawled}")
    print(f"Chunks       : {status.chunks_created}")

    if status.state.value != "done":
        print(f"ERROR Indexing failed: {status.error}")
        return

    # Single-turn questions
    single_turn_tests = [
        ("LEVEL 1 - direct facts", "What is the Pixar Theory?"),
        ("LEVEL 1 - direct facts", "Who is Merida?"),
        ("LEVEL 2 - specific facts", "What does Merida's mother turn into?"),
        ("LEVEL 2 - specific facts", "Why do the toys come to life in Toy Story according to the theory?"),
        ("LEVEL 3 - multi-chunk reasoning", "How does Merida's discovery of magic in Brave connect to animals and machines in later movies?"),
    ]

    for level, question in single_turn_tests:
        print(f"\n-------------------------------------------------------")
        print(f"[{level}] Q: {question}")
        print(f"-------------------------------------------------------")
        answer = ""
        sources = []
        async for event in chat.stream_answer(question):
            if event.get("type") == "token":
                answer += event["content"]
            elif event.get("type") == "sources":
                sources = event["sources"]
        print(f"A: {answer}\n")
        print(f"Sources: {[s['title'] for s in sources]}")

    # Conversational follow-up stream
    print(f"\n=======================================================")
    print(f"  LEVEL 4 — CONVERSATIONAL FOLLOW-UP TEST")
    print(f"=======================================================")
    
    history = []
    turns = [
        "Tell me about Merida.",
        "What happens to her mother?",
        "Why does that happen?",
        "How does that connect to the larger theory?",
    ]

    for question in turns:
        print(f"\nUser: {question}")
        answer = ""
        sources = []
        async for event in chat.stream_answer(question, history=history):
            if event.get("type") == "token":
                answer += event["content"]
            elif event.get("type") == "sources":
                sources = event["sources"]
        print(f"SiteMind: {answer}")
        # Append to history
        history.append({"role": "user", "content": question})
        history.append({"role": "assistant", "content": answer})

if __name__ == "__main__":
    asyncio.run(run_eval())
