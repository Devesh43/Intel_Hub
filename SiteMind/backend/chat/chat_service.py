"""
SiteMind — RAG Chat Service
Implements advanced RAG with:
1. Conversational Query Contextualization (resolves pronouns & follow-ups using history)
2. Multi-Candidate Hybrid Retrieval & Keyword Reranking
3. Query Reformulation Fallback (multi-query search when initial scores are weak)
4. Grounded Synthesis System Prompt (synthesizes facts across multiple chunks)
"""
import logging
import re
from typing import AsyncIterator, Optional

from providers.base import AIProvider
from vectorstore.base import VectorStore, SearchResult
from models.domain import ChatSource
from config.settings import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "sitemind_website"

SYSTEM_PROMPT_TEMPLATE = """You are SiteMind, an intelligent AI assistant that answers questions based on the retrieved context from the indexed website.

INSTRUCTIONS:
1. Synthesize information from across all provided context chunks to give a accurate, clear, and comprehensive answer.
2. Resolve entities, pronouns, and references (such as "he", "she", "they", "this character", "this event") using the conversation history and context.
3. Reason step-by-step over the facts present in the evidence. You are permitted to make logical inferences directly supported by the context.
4. Always cite the specific source pages and section titles used in your answer.
5. If the provided context genuinely does NOT contain enough information to support an answer, state clearly: "I couldn't find that information on the indexed website."

RETRIEVED CONTEXT FROM WEBSITE:
{context}

---
Based strictly on the evidence above, answer the user's question. If the information is not present, state that you couldn't find it on the indexed website."""


class ChatService:
    """
    Advanced RAG pipeline: contextualizes queries, retrieves multi-candidate chunks, reranks, and streams grounded answers.
    """

    def __init__(
        self,
        ai_provider: AIProvider,
        vector_store: VectorStore,
        top_k: int = settings.top_k_results,
    ) -> None:
        self._ai = ai_provider
        self._store = vector_store
        self._top_k = top_k

    async def stream_answer(
        self,
        question: str,
        history: Optional[list[dict]] = None,
        collection_name: str = COLLECTION_NAME,
    ) -> AsyncIterator[dict]:
        """
        Stream a RAG response for the given question.
        """
        try:
            # ── Step 1: Contextualize Query using Conversation History ─────
            search_query = await self._contextualize_query(question, history)

            # ── Step 2: Multi-Candidate Retrieval & Reranking ─────────────
            results = await self._retrieve_best_chunks(search_query, collection_name)

            # If top score is low, attempt query reformulation fallback pass
            if not results or (results and results[0].score < 0.40):
                logger.info("Initial retrieval weak (top score: %s). Attempting query reformulation fallback...", results[0].score if results else 0)
                reformulated = await self._reformulate_query(search_query)
                if reformulated != search_query:
                    fallback_results = await self._retrieve_best_chunks(reformulated, collection_name)
                    # Combine & deduplicate results
                    results = self._merge_results(results, fallback_results)

            if not results:
                yield {
                    "type": "token",
                    "content": "I couldn't find that information on the indexed website.",
                }
                yield {"type": "sources", "sources": []}
                return

            # ── Step 3: Build Context & System Prompt ──────────────────────
            context, sources = self._build_context(results)
            system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)

            # Format user message combining history if needed
            user_msg = f"User Question: {question}"
            if search_query != question:
                user_msg += f"\n(Contextualized Search Intent: {search_query})"

            # ── Step 4: Stream Response from Gemini ────────────────────────
            async for token in self._ai.chat_stream(
                system_prompt=system_prompt,
                user_message=user_msg,
            ):
                yield {"type": "token", "content": token}

            # ── Step 5: Yield Sources ──────────────────────────────────────
            yield {
                "type": "sources",
                "sources": [
                    {"title": s.title, "url": s.url}
                    for s in sources
                ],
            }

        except Exception as e:
            logger.error("ChatService error: %s", e, exc_info=True)
            yield {
                "type": "error",
                "content": f"An error occurred while generating the answer: {e}",
            }

    async def _contextualize_query(self, question: str, history: Optional[list[dict]]) -> str:
        """
        Rewrite follow-up questions (e.g., 'she turns into what?') into standalone queries.
        """
        if not history or len(history) == 0:
            return question

        # Check if question contains pronouns or ambiguous references
        followup_signals = ["she", "he", "they", "it", "this", "that", "who", "what", "why", "how", "turns", "happens"]
        is_followup = any(re.search(rf"\b{sig}\b", question.lower()) for sig in followup_signals) or len(question.split()) < 6

        if not is_followup:
            return question

        history_str = "\n".join(
            [f"{msg['role'].capitalize()}: {msg['content']}" for msg in history[-6:]]
        )
        prompt = (
            f"Given the conversation history and a follow-up question, rewrite the question into a single, self-contained search query. "
            f"Explicitly include subject entities, character names, or topics implied by the history. Do NOT answer the question, only output the rewritten query.\n\n"
            f"History:\n{history_str}\n\n"
            f"Follow-up Question: {question}\n\n"
            f"Standalone Query:"
        )

        try:
            rewritten = ""
            async for token in self._ai.chat_stream(
                system_prompt="You are a query contextualization assistant.",
                user_message=prompt,
            ):
                rewritten += token
            rewritten = rewritten.strip().strip('"').strip("'")
            if rewritten and len(rewritten) > 3:
                logger.info("Contextualized query: %r -> %r", question, rewritten)
                return rewritten
        except Exception as e:
            logger.warning("Query contextualization failed: %s", e)

        return question

    async def _reformulate_query(self, query: str) -> str:
        """
        Generate alternative search keywords if initial retrieval yields weak matches.
        """
        prompt = (
            f"Extract 3 to 5 core key terms, topics, or entity names for searching a website database regarding this question. "
            f"Question: {query}\n"
            f"Return ONLY the key terms separated by spaces."
        )
        try:
            res = ""
            async for token in self._ai.chat_stream(
                system_prompt="You are a search term extractor.",
                user_message=prompt,
            ):
                res += token
            res = res.strip()
            if res:
                return res
        except Exception:
            pass
        return query

    async def _retrieve_best_chunks(self, query: str, collection_name: str) -> list[SearchResult]:
        """
        Retrieve 15 candidates, perform hybrid keyword-boosted reranking, and select top 8.
        """
        query_embedding = await (
            self._ai.embed_query(query)
            if hasattr(self._ai, "embed_query")
            else self._ai.embed(query)
        )

        candidates = await self._store.query(
            collection_name=collection_name,
            query_vector=query_embedding,
            top_k=15,
        )

        if not candidates:
            return []

        # Extract query keywords for lexical reranking
        keywords = [
            w.lower() for w in re.findall(r"\b\w{3,}\b", query)
            if w.lower() not in {"what", "where", "when", "which", "about", "tell", "this", "that", "there", "their", "from", "with", "into"}
        ]

        scored = []
        for c in candidates:
            score = c.score
            text_lower = c.text.lower()
            # Boost score if candidate text contains explicit query keywords
            matches = sum(1 for kw in keywords if kw in text_lower)
            hybrid_score = score + (matches * 0.04)
            scored.append((hybrid_score, c))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:8]]

    def _merge_results(self, list1: list[SearchResult], list2: list[SearchResult]) -> list[SearchResult]:
        """Merge and deduplicate two sets of search results."""
        seen = set()
        merged = []
        for item in list1 + list2:
            key = item.text[:100]
            if key not in seen:
                seen.add(key)
                merged.append(item)
        return merged[:8]

    def _build_context(
        self, results: list[SearchResult]
    ) -> tuple[str, list[ChatSource]]:
        """
        Build context string with source attributions.
        """
        context_parts = []
        seen_urls: set[str] = set()
        sources: list[ChatSource] = []

        for i, result in enumerate(results, 1):
            title = result.page_title or result.page_url
            context_parts.append(
                f"[Source {i}: {title}]\n"
                f"URL: {result.page_url}\n"
                f"{result.text}"
            )

            if result.page_url not in seen_urls:
                seen_urls.add(result.page_url)
                sources.append(
                    ChatSource(
                        title=title,
                        url=result.page_url,
                    )
                )

        context = "\n\n---\n\n".join(context_parts)
        return context, sources
