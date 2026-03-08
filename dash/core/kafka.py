"""
Kafka producer/consumer wrapper with in-memory asyncio.Queue fallback.

When bootstrap_servers == "memory", all messaging is done via in-process
asyncio Queues — no Kafka installation required for local development.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncIterator, Dict, Optional

logger = logging.getLogger(__name__)

# ── In-memory bus ─────────────────────────────────────────────────────────────

_queues: Dict[str, asyncio.Queue] = {}


def _get_queue(topic: str) -> asyncio.Queue:
    if topic not in _queues:
        _queues[topic] = asyncio.Queue(maxsize=10_000)
    return _queues[topic]


# ── Producer ──────────────────────────────────────────────────────────────────

class Producer:
    """Unified producer — delegates to aiokafka or in-memory queue."""

    def __init__(self, bootstrap_servers: str):
        self._servers = bootstrap_servers
        self._memory = bootstrap_servers == "memory"
        self._producer = None

    async def start(self):
        if self._memory:
            logger.info("[producer] Using in-memory bus")
            return
        try:
            from aiokafka import AIOKafkaProducer  # type: ignore
            self._producer = AIOKafkaProducer(
                bootstrap_servers=self._servers,
                value_serializer=lambda v: json.dumps(v).encode(),
            )
            await self._producer.start()
            logger.info("[producer] Connected to Kafka: %s", self._servers)
        except Exception as exc:
            logger.warning("[producer] Kafka unavailable (%s); falling back to in-memory", exc)
            self._memory = True

    async def send(self, topic: str, value: Any):
        if self._memory:
            await _get_queue(topic).put(value)
        else:
            await self._producer.send(topic, value)

    async def stop(self):
        if self._producer:
            await self._producer.stop()


# ── Consumer ──────────────────────────────────────────────────────────────────

class Consumer:
    """Unified consumer — delegates to aiokafka or in-memory queue."""

    def __init__(self, bootstrap_servers: str, topics: list[str], group_id: str):
        self._servers = bootstrap_servers
        self._topics = topics
        self._group_id = group_id
        self._memory = bootstrap_servers == "memory"
        self._consumer = None
        self._stop_event = asyncio.Event()

    async def start(self):
        if self._memory:
            logger.info("[consumer:%s] Using in-memory bus for topics: %s", self._group_id, self._topics)
            return
        try:
            from aiokafka import AIOKafkaConsumer  # type: ignore
            self._consumer = AIOKafkaConsumer(
                *self._topics,
                bootstrap_servers=self._servers,
                group_id=self._group_id,
                value_deserializer=lambda v: json.loads(v.decode()),
                auto_offset_reset="latest",
            )
            await self._consumer.start()
            logger.info("[consumer:%s] Connected to Kafka", self._group_id)
        except Exception as exc:
            logger.warning("[consumer:%s] Kafka unavailable (%s); using in-memory", self._group_id, exc)
            self._memory = True

    async def stream(self) -> AsyncIterator[Any]:
        """Yield messages one at a time."""
        if self._memory:
            # Round-robin across subscribed topics
            queues = [_get_queue(t) for t in self._topics]
            idx = 0
            while not self._stop_event.is_set():
                q = queues[idx % len(queues)]
                idx += 1
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=0.5)
                    yield msg
                except asyncio.TimeoutError:
                    continue
        else:
            async for msg in self._consumer:
                if self._stop_event.is_set():
                    break
                yield msg.value

    def stop(self):
        self._stop_event.set()

    async def close(self):
        self.stop()
        if self._consumer:
            await self._consumer.stop()
