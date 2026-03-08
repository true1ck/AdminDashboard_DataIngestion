"""
PostgreSQL consumer.

Upserts ProcessedItem records into a `processed_items` table.
Auto-creates the table on first run. Uses psycopg2.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict

from core.base import BaseConsumer
from core.schemas import ProcessedItem

logger = logging.getLogger(__name__)

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS processed_items (
    id                  TEXT PRIMARY KEY,
    raw_id              TEXT,
    entity              TEXT,
    platform            TEXT,
    platform_item_id    TEXT,
    author              TEXT,
    author_verified     BOOLEAN,
    content_type        TEXT,
    topic               TEXT,
    text                TEXT,
    text_en             TEXT,
    language            TEXT,
    sentiment           REAL,
    sentiment_label     TEXT,
    emotion             TEXT,
    topic_label         TEXT,
    pillar              TEXT,
    urgency             TEXT,
    is_threat           BOOLEAN,
    threat_score        REAL,
    entities            JSONB,
    engagement          JSONB,
    key_quotes          JSONB,
    media_urls          JSONB,
    processing_meta     JSONB,
    original_timestamp  TIMESTAMPTZ,
    ingested_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (platform, platform_item_id)
);

CREATE INDEX IF NOT EXISTS idx_pi_entity     ON processed_items(entity);
CREATE INDEX IF NOT EXISTS idx_pi_platform   ON processed_items(platform);
CREATE INDEX IF NOT EXISTS idx_pi_topic      ON processed_items(topic);
CREATE INDEX IF NOT EXISTS idx_pi_ingested   ON processed_items(ingested_at DESC);
"""

UPSERT_SQL = """
INSERT INTO processed_items (
    id, raw_id, entity, platform, platform_item_id, author, author_verified,
    content_type, topic, text, text_en, language,
    sentiment, sentiment_label, emotion, topic_label, pillar, urgency,
    is_threat, threat_score, entities, engagement, key_quotes, media_urls,
    processing_meta, original_timestamp, ingested_at
) VALUES (
    %(id)s, %(raw_id)s, %(entity)s, %(platform)s, %(platform_item_id)s,
    %(author)s, %(author_verified)s, %(content_type)s, %(topic)s,
    %(text)s, %(text_en)s, %(language)s, %(sentiment)s, %(sentiment_label)s,
    %(emotion)s, %(topic_label)s, %(pillar)s, %(urgency)s,
    %(is_threat)s, %(threat_score)s,
    %(entities)s, %(engagement)s, %(key_quotes)s, %(media_urls)s,
    %(processing_meta)s, %(original_timestamp)s, %(ingested_at)s
)
ON CONFLICT (platform, platform_item_id)
DO UPDATE SET
    sentiment       = EXCLUDED.sentiment,
    sentiment_label = EXCLUDED.sentiment_label,
    entities        = EXCLUDED.entities,
    topic_label     = EXCLUDED.topic_label,
    pillar          = EXCLUDED.pillar,
    is_threat       = EXCLUDED.is_threat,
    threat_score    = EXCLUDED.threat_score,
    processing_meta = EXCLUDED.processing_meta;
"""


class PostgresConsumer(BaseConsumer):
    """Upserts processed items into PostgreSQL."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._conn_str: str = config.get(
            "connection_string",
            "postgresql://postgres:postgres@localhost:5432/entity_intel",
        )
        self._table: str = config.get("table_name", "processed_items")
        self._conn = None

    def _get_conn(self):
        if self._conn is None or self._conn.closed:
            try:
                import psycopg2  # type: ignore
                import psycopg2.extras  # type: ignore
                self._conn = psycopg2.connect(self._conn_str)
                self._conn.autocommit = True
                with self._conn.cursor() as cur:
                    cur.execute(CREATE_TABLE_SQL)
                logger.info("[postgres] Connected and table ensured")
            except ImportError:
                logger.error("[postgres] psycopg2 not installed")
                raise
            except Exception as exc:
                logger.error("[postgres] Connection failed: %s", exc)
                raise
        return self._conn

    async def consume(self, item: ProcessedItem) -> None:
        import asyncio
        await asyncio.to_thread(self._upsert, item)

    def _upsert(self, item: ProcessedItem):
        try:
            import psycopg2.extras  # type: ignore
            conn = self._get_conn()
            with conn.cursor() as cur:
                cur.execute(UPSERT_SQL, {
                    "id": item.id,
                    "raw_id": item.raw_id,
                    "entity": item.entity,
                    "platform": item.platform,
                    "platform_item_id": item.platform_item_id or item.id,
                    "author": item.author,
                    "author_verified": item.author_verified,
                    "content_type": item.content_type,
                    "topic": item.topic,
                    "text": (item.text or "")[:10_000],
                    "text_en": (item.text_en or "")[:10_000],
                    "language": item.language,
                    "sentiment": item.sentiment,
                    "sentiment_label": item.sentiment_label,
                    "emotion": item.emotion,
                    "topic_label": item.topic_label,
                    "pillar": item.pillar,
                    "urgency": item.urgency,
                    "is_threat": item.is_threat,
                    "threat_score": item.threat_score,
                    "entities": json.dumps([e.model_dump() for e in item.entities]),
                    "engagement": json.dumps(item.engagement.model_dump()),
                    "key_quotes": json.dumps(item.key_quotes),
                    "media_urls": json.dumps(item.media_urls),
                    "processing_meta": json.dumps(item.processing_meta.model_dump()),
                    "original_timestamp": item.original_timestamp,
                    "ingested_at": item.ingested_at,
                })
            logger.debug("[postgres] Upserted item: %s", item.id)
        except Exception as exc:
            logger.error("[postgres] Upsert failed for %s: %s", item.id, exc)
            self._conn = None  # force reconnect on next call
            raise
