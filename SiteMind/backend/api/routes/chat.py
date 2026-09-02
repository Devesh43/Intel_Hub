"""
SiteMind — Chat API Routes
POST /chat — Stream a RAG answer via Server-Sent Events
"""
import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from api.schemas import ChatRequest
from models.domain import IndexState
from utils.url_utils import get_collection_name

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("")
async def chat(body: ChatRequest, request: Request):
    """
    Stream a RAG-powered answer for the user's question.

    Response format: Server-Sent Events (SSE)
    Each event is a JSON object:
      data: {"type": "token",   "content": "..."}
      data: {"type": "sources", "sources": [...]}
      data: {"type": "error",   "content": "..."}
      data: [DONE]
    """
    status = request.app.state.index_status
    chat_service = request.app.state.chat_service

    # Guard: must have a completed index
    if status.state != IndexState.DONE or status.website is None:
        raise HTTPException(
            status_code=400,
            detail="No website has been indexed yet. Please index a website first.",
        )

    collection_name = get_collection_name(status.website.url)
    history_list = [h.dict() for h in body.history] if body.history else None

    async def event_stream() -> AsyncIterator[str]:
        try:
            async for event in chat_service.stream_answer(
                body.question,
                history=history_list,
                collection_name=collection_name,
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error("Chat stream error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )