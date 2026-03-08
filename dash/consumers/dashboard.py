"""
Dashboard consumer.

POSTs pipeline events to the FastAPI event store so they appear in
the live feed of the NetaBoardV5 monitoring UI.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from core.base import BaseConsumer
from core.schemas import ProcessedItem

logger = logging.getLogger(__name__)

DASHBOARD_API = "http://localhost:8500/api/v1/events"


class DashboardConsumer(BaseConsumer):
    """Forwards processed items to the dashboard live feed."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._api_url: str = config.get("api_url", DASHBOARD_API)
        self._pipeline_id: Optional[str] = config.get("pipeline_id")
        self._available: Optional[bool] = None

    async def consume(self, item: ProcessedItem) -> None:
        event = {
            "pipeline_id": self._pipeline_id,
            "stage": "consumer",
            "node_id": "dashboard",
            "event_type": "processed_item",
            "platform": item.platform,
            "entity": item.entity,
            "topic": item.topic,
            "author": item.author,
            "text": (item.text or "")[:500],
            "sentiment": item.sentiment,
            "sentiment_label": item.sentiment_label,
            "entities": [e.text for e in item.entities[:5]],
            "topic_label": item.topic_label,
            "is_threat": item.is_threat,
            "metadata": {
                "content_type": item.content_type,
                "pillar": item.pillar,
                "engagement": item.engagement.model_dump(),
            },
        }
        await self._post_event(event)

    async def _post_event(self, event: Dict[str, Any]):
        try:
            import httpx  # type: ignore
            async with httpx.AsyncClient(timeout=5) as client:
                if self._available is None:
                    try:
                        h = await client.get(self._api_url.replace("/events", "/health"), timeout=2)
                        self._available = True
                    except Exception:
                        self._available = False
                        logger.warning("[dashboard] API not reachable at %s; logging locally", self._api_url)
                        return

                if not self._available:
                    return

                resp = await client.post(self._api_url, json=event)
                if resp.status_code not in (200, 201):
                    logger.debug("[dashboard] POST returned %d", resp.status_code)
        except Exception as exc:
            logger.debug("[dashboard] Could not post event: %s", exc)
            self._available = False
