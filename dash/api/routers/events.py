"""
Events router.

GET  /api/v1/events            — filtered event list
GET  /api/v1/events/stream     — SSE real-time stream
GET  /api/v1/events/topics     — distinct topic list
GET  /api/v1/events/stats      — summary statistics
POST /api/v1/events            — ingest single event (used by pipeline consumers)
POST /api/v1/events/batch      — ingest multiple events
DELETE /api/v1/events          — clear event buffer
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.services.event_store import event_store

router = APIRouter(prefix="/api/v1/events", tags=["events"])


# ── Models ────────────────────────────────────────────────────────────────────

class EventIn(BaseModel):
    pipeline_id: Optional[str] = None
    stage: str = "unknown"
    node_id: Optional[str] = None
    event_type: str = "trace"
    platform: Optional[str] = None
    entity: Optional[str] = None
    topic: Optional[str] = None
    author: Optional[str] = None
    text: Optional[str] = None
    sentiment: Optional[float] = None
    sentiment_label: Optional[str] = None
    entities: List[str] = []
    topic_label: Optional[str] = None
    is_threat: bool = False
    video_id: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = {}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
def list_events(
    limit: int = Query(default=100, ge=1, le=500),
    since: Optional[str] = Query(default=None),
    pipeline_id: Optional[str] = Query(default=None),
    topic: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    event_type: Optional[str] = Query(default=None),
    entity: Optional[str] = Query(default=None),
):
    return event_store.get_events(
        limit=limit, since=since, pipeline_id=pipeline_id,
        topic=topic, stage=stage, event_type=event_type, entity=entity,
    )


@router.get("/stream")
async def event_stream(request: Request):
    """Server-Sent Events endpoint for real-time event push."""
    q = event_store.subscribe()

    async def generator():
        try:
            # Send a heartbeat comment immediately to establish connection
            yield ": connected\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(q.get(), timeout=15)
                    data = json.dumps(event, default=str)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"
        finally:
            event_store.unsubscribe(q)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/topics")
def list_topics(pipeline_id: Optional[str] = Query(default=None)):
    return event_store.get_topics(pipeline_id=pipeline_id)


@router.get("/stats")
def get_stats():
    return event_store.get_stats()


@router.post("", status_code=201)
def ingest_event(event: EventIn):
    return event_store.push(event.model_dump())


@router.post("/batch", status_code=201)
def ingest_batch(events: List[EventIn]):
    return event_store.push_batch([e.model_dump() for e in events])


@router.delete("")
def clear_events():
    event_store.clear()
    return {"message": "Event buffer cleared"}
