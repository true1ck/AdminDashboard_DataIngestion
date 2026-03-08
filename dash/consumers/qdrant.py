"""
Qdrant vector store consumer.

Upserts ProcessedItem embeddings into a Qdrant collection for
semantic similarity search. Creates the collection if it doesn't exist.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict

from core.base import BaseConsumer
from core.schemas import ProcessedItem

logger = logging.getLogger(__name__)


class QdrantConsumer(BaseConsumer):
    """Stores embeddings in Qdrant for semantic search."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._url: str = config.get("url", "http://localhost:6333")
        self._collection: str = config.get("collection_name", "entity_intel")
        self._vector_size: int = config.get("vector_size", 384)  # all-MiniLM-L6-v2
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from qdrant_client import QdrantClient  # type: ignore
                from qdrant_client.models import Distance, VectorParams  # type: ignore
                self._client = QdrantClient(url=self._url)
                # Ensure collection exists
                existing = [c.name for c in self._client.get_collections().collections]
                if self._collection not in existing:
                    self._client.create_collection(
                        collection_name=self._collection,
                        vectors_config=VectorParams(
                            size=self._vector_size,
                            distance=Distance.COSINE,
                        ),
                    )
                    logger.info("[qdrant] Created collection: %s", self._collection)
            except ImportError:
                logger.error("[qdrant] qdrant-client not installed")
                raise
            except Exception as exc:
                logger.error("[qdrant] Connection failed: %s", exc)
                raise
        return self._client

    async def consume(self, item: ProcessedItem) -> None:
        if not item.embedding:
            logger.debug("[qdrant] Skipping item without embedding: %s", item.id)
            return

        import asyncio
        await asyncio.to_thread(self._upsert, item)

    def _upsert(self, item: ProcessedItem):
        try:
            from qdrant_client.models import PointStruct  # type: ignore
            client = self._get_client()

            # Use a deterministic numeric id derived from the string uuid
            point_id = str(uuid.UUID(item.id)) if len(item.id) == 36 else str(uuid.uuid4())

            payload = {
                "doc_id": item.id,
                "entity": item.entity,
                "platform": item.platform,
                "author": item.author,
                "topic": item.topic,
                "content_type": item.content_type,
                "sentiment": item.sentiment,
                "sentiment_label": item.sentiment_label,
                "topic_label": item.topic_label,
                "pillar": item.pillar,
                "is_threat": item.is_threat,
                "text_preview": (item.text or "")[:500],
                "entities": [e.text for e in item.entities],
                "original_timestamp": item.original_timestamp.isoformat() if item.original_timestamp else None,
                "ingested_at": item.ingested_at.isoformat(),
            }

            client.upsert(
                collection_name=self._collection,
                points=[PointStruct(
                    id=point_id,
                    vector=item.embedding,
                    payload=payload,
                )],
            )
            logger.debug("[qdrant] Upserted point: %s", point_id)
        except Exception as exc:
            logger.error("[qdrant] Upsert failed for %s: %s", item.id, exc)
            self._client = None
            raise
