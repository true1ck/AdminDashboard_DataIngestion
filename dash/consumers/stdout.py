"""Stdout consumer — logs processed items for debugging."""

from __future__ import annotations

import logging
from typing import Any, Dict

from core.base import BaseConsumer
from core.schemas import ProcessedItem

logger = logging.getLogger(__name__)


class StdoutConsumer(BaseConsumer):
    """Prints a summary of each processed item to stdout/logs."""

    async def consume(self, item: ProcessedItem) -> None:
        entity_names = [e.text for e in item.entities[:3]]
        logger.info(
            "[stdout] [%s][%s] %s | sentiment=%s | entities=%s | topic=%s | threat=%s",
            item.platform.upper(),
            item.topic or "-",
            (item.author or "unknown")[:30],
            item.sentiment_label or "?",
            entity_names,
            item.topic_label or "-",
            "⚠️" if item.is_threat else "✓",
        )
