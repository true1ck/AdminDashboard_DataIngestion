"""
In-memory event store with filtering and SSE broadcast support.

Holds up to MAX_EVENTS events in a circular deque. Supports filtering
by pipeline_id, topic, stage, event_type, and time (since).
Also maintains an asyncio.Queue per SSE subscriber for real-time push.
"""

from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime
from typing import Any, Deque, Dict, List, Optional, Set


MAX_EVENTS = 500


class EventStore:
    def __init__(self):
        self._events: Deque[Dict[str, Any]] = deque(maxlen=MAX_EVENTS)
        self._subscribers: Set[asyncio.Queue] = set()

    # ── Write ─────────────────────────────────────────────────────────────────

    def push(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Add event to buffer and broadcast to all SSE subscribers."""
        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat()
        self._events.appendleft(event)
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass
        return event

    def push_batch(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self.push(e) for e in events]

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_events(
        self,
        limit: int = 100,
        since: Optional[str] = None,
        pipeline_id: Optional[str] = None,
        topic: Optional[str] = None,
        stage: Optional[str] = None,
        event_type: Optional[str] = None,
        entity: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        events = list(self._events)

        since_dt = None
        if since:
            try:
                since_dt = datetime.fromisoformat(since)
            except ValueError:
                pass

        results = []
        for e in events:
            if pipeline_id and e.get("pipeline_id") != pipeline_id:
                continue
            if topic and e.get("topic") != topic:
                continue
            if stage and e.get("stage") != stage:
                continue
            if event_type and e.get("event_type") != event_type:
                continue
            if entity and (e.get("entity") or "").lower() != entity.lower():
                continue
            if since_dt:
                try:
                    evt_dt = datetime.fromisoformat(e.get("timestamp", ""))
                    if evt_dt <= since_dt:
                        continue
                except ValueError:
                    pass
            results.append(e)
            if len(results) >= limit:
                break
        return results

    def get_topics(self, pipeline_id: Optional[str] = None) -> List[str]:
        seen: List[str] = []
        for e in self._events:
            if pipeline_id and e.get("pipeline_id") != pipeline_id:
                continue
            t = e.get("topic")
            if t and t not in seen:
                seen.append(t)
        return seen

    def get_stats(self) -> Dict[str, Any]:
        total = len(self._events)
        threats = sum(1 for e in self._events if e.get("is_threat"))
        platforms = {}
        for e in self._events:
            p = e.get("platform", "unknown")
            platforms[p] = platforms.get(p, 0) + 1
        return {
            "total_events": total,
            "threats": threats,
            "platforms": platforms,
            "subscribers": len(self._subscribers),
        }

    def clear(self):
        self._events.clear()

    # ── SSE subscription ──────────────────────────────────────────────────────

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self._subscribers.discard(q)


# Singleton
event_store = EventStore()
