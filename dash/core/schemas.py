"""Core data schemas for the Entity Intelligence Pipeline."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


ContentType = Literal["text", "video", "audio", "image"]
Platform = Literal["youtube", "twitter", "instagram", "news_rss", "mock"]
EntityType = Literal["PERSON", "ORG", "LOC", "EVENT", "POLICY", "OTHER"]
Urgency = Literal["tatkal", "shighra", "samanya"]


class Engagement(BaseModel):
    likes: int = 0
    shares: int = 0
    replies: int = 0
    views: int = 0
    comments: int = 0


class Entity(BaseModel):
    text: str
    type: EntityType = "OTHER"
    relevance: float = 1.0
    normalized: Optional[str] = None


class ProcessingMeta(BaseModel):
    processors_applied: List[str] = Field(default_factory=list)
    total_processing_ms: int = 0
    pipeline_run_id: Optional[str] = None
    model_versions: Dict[str, str] = Field(default_factory=dict)


# ── Layer 1: Raw ──────────────────────────────────────────────────────────────

class RawItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_collector: str
    platform: str
    platform_item_id: Optional[str] = None   # native ID (video_id, tweet_id, etc.)
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    entity: Optional[str] = None             # target person / entity being tracked
    event: Optional[str] = None              # related event (rally, speech, etc.)
    auth_context: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ── Layer 2: Normalized ───────────────────────────────────────────────────────

class NormalizedItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    raw_id: Optional[str] = None
    source_collector: str
    platform: str
    platform_item_id: Optional[str] = None

    # Target context
    entity: Optional[str] = None          # person / entity being tracked
    event: Optional[str] = None           # related event (rally, speech, etc.)
    topic: Optional[str] = None           # "{Entity}_{Platform}" e.g. "RahulGandhi_YouTube"

    # Content
    content_type: Optional[ContentType] = None
    text: Optional[str] = None
    text_en: Optional[str] = None         # English translation if source is Hindi
    language: Optional[str] = None
    media_urls: List[str] = Field(default_factory=list)
    audio_path: Optional[str] = None
    video_path: Optional[str] = None
    subtitle_path: Optional[str] = None

    # Author
    author: Optional[str] = None
    author_id: Optional[str] = None
    author_verified: bool = False

    # Engagement metrics
    engagement: Engagement = Field(default_factory=Engagement)

    # Timestamps
    original_timestamp: Optional[datetime] = None
    ingested_at: datetime = Field(default_factory=datetime.utcnow)
    normalized_at: datetime = Field(default_factory=datetime.utcnow)

    dedup_hash: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ── Layer 3: Processed ────────────────────────────────────────────────────────

class ProcessedItem(NormalizedItem):
    # Sentiment
    sentiment: Optional[float] = None         # -1.0 to +1.0
    sentiment_label: Optional[str] = None     # positive / negative / neutral
    sentiment_subjectivity: Optional[float] = None

    # Emotion (Plutchik 8-class)
    emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None

    # Named Entities extracted from content
    entities: List[Entity] = Field(default_factory=list)

    # Topic / pillar mapping
    topic_label: Optional[str] = None
    topic_scores: Dict[str, float] = Field(default_factory=dict)  # {topic: score}

    # Intelligence signals
    pillar: Optional[str] = None              # NRI pillar key
    pillar_confidence: Optional[float] = None
    urgency: Optional[Urgency] = None
    is_threat: bool = False
    threat_score: float = 0.0
    threat_category: Optional[str] = None

    # Key content extracted
    key_quotes: List[str] = Field(default_factory=list)
    promises: List[str] = Field(default_factory=list)
    policy_mentions: List[str] = Field(default_factory=list)

    # Embedding (stored separately in Qdrant, referenced here)
    embedding: Optional[List[float]] = None

    processing_meta: ProcessingMeta = Field(default_factory=ProcessingMeta)


# ── Layer 4: Embedded (Qdrant payload) ───────────────────────────────────────

class EmbeddedChunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_id: str
    vector: List[float]
    text: str
    platform: Optional[str] = None
    entity: Optional[str] = None
    author: Optional[str] = None
    topic: Optional[str] = None
    sentiment: Optional[float] = None
    original_timestamp: Optional[datetime] = None


# ── Pipeline Events (for dashboard feed) ─────────────────────────────────────

class PipelineEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pipeline_id: Optional[str] = None
    stage: str                                # collector / transformer / processor / consumer
    node_id: Optional[str] = None
    event_type: str = "trace"                 # trace / processed_item / error / audit / dlq
    platform: Optional[str] = None
    entity: Optional[str] = None
    topic: Optional[str] = None
    author: Optional[str] = None
    text: Optional[str] = None
    sentiment: Optional[float] = None
    sentiment_label: Optional[str] = None
    entities: List[str] = Field(default_factory=list)  # entity text list for display
    topic_label: Optional[str] = None
    is_threat: bool = False
    video_id: Optional[str] = None
    error_message: Optional[str] = None
    payload_preview: Optional[str] = None     # for DLQ entries
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
