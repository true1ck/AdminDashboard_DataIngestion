"""Pipeline configuration schemas (Pydantic) and YAML loader."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import yaml
from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class PlatformAuth(BaseModel):
    method: Literal["none", "api_key", "oauth2", "bearer"] = "none"
    credential_key: Optional[str] = None     # env-var name holding the secret
    webhook_verify_token: Optional[str] = None


# ── Collector sub-configs ─────────────────────────────────────────────────────

class CollectorWhat(BaseModel):
    content_types: List[str] = Field(default_factory=lambda: ["text"])
    include_media: bool = False
    languages: List[str] = Field(default_factory=lambda: ["en", "hi"])


class CollectorWho(BaseModel):
    track_accounts: List[str] = Field(default_factory=list)
    track_keywords: List[str] = Field(default_factory=list)
    search_queries: List[str] = Field(default_factory=list)
    channels: List[str] = Field(default_factory=list)
    rss_urls: List[str] = Field(default_factory=list)
    max_results: int = 10


class CollectorWhen(BaseModel):
    mode: Literal["polling", "streaming", "scheduled", "once"] = "polling"
    poll_interval_sec: int = 60


class CollectorRateLimit(BaseModel):
    requests_per_minute: int = 10
    max_items_per_poll: int = 20
    backoff_strategy: Literal["fixed", "exponential"] = "exponential"


class CollectorConfig(BaseModel):
    id: str
    platform: str                            # youtube / twitter / instagram / news_rss / mock
    enabled: bool = True
    auth: PlatformAuth = Field(default_factory=PlatformAuth)
    what: CollectorWhat = Field(default_factory=CollectorWhat)
    who: CollectorWho = Field(default_factory=CollectorWho)
    when: CollectorWhen = Field(default_factory=CollectorWhen)
    rate_limit: CollectorRateLimit = Field(default_factory=CollectorRateLimit)
    entity: Optional[str] = None            # default entity for all collected items
    event: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    replicas: int = 1


# ── Transformer sub-configs ───────────────────────────────────────────────────

class TransformerConfig(BaseModel):
    id: str
    type: str                                # normalizer / deduplicator
    enabled: bool = True
    config: Dict[str, Any] = Field(default_factory=dict)
    replicas: int = 1


# ── Processor sub-configs ─────────────────────────────────────────────────────

class ProcessorResources(BaseModel):
    cpu: float = 1.0
    gpu: float = 0.0
    memory_mb: int = 512


class ProcessorConfig(BaseModel):
    id: str
    type: str                                # ner / sentiment / transcriber / ocr / topic / embedder
    enabled: bool = True
    config: Dict[str, Any] = Field(default_factory=dict)
    resources: ProcessorResources = Field(default_factory=ProcessorResources)
    timeout_sec: int = 30
    replicas: int = 1


# ── Consumer sub-configs ──────────────────────────────────────────────────────

class ConsumerConfig(BaseModel):
    id: str
    type: str                                # postgres / qdrant / dashboard / stdout
    enabled: bool = True
    config: Dict[str, Any] = Field(default_factory=dict)
    trigger: Literal["all", "threat_only", "pillar_match"] = "all"
    replicas: int = 1


# ── Kafka / Message Bus ───────────────────────────────────────────────────────

class KafkaConfig(BaseModel):
    bootstrap_servers: str = "memory"        # "memory" uses in-process asyncio.Queue
    topics: Dict[str, str] = Field(default_factory=lambda: {
        "raw": "raw-items",
        "normalized": "normalized-items",
        "processed": "processed-items",
        "dlq": "dead-letter-queue",
    })
    consumer_group_prefix: str = "eip"
    partitions: int = 4
    replication_factor: int = 1


# ── Pipeline root config ──────────────────────────────────────────────────────

class PipelineMeta(BaseModel):
    name: str
    description: str = ""
    version: str = "1.0"
    entity: Optional[str] = None            # primary entity for the whole pipeline
    known_topics: List[str] = Field(default_factory=list)


class PipelineConfig(BaseModel):
    pipeline: PipelineMeta
    kafka: KafkaConfig = Field(default_factory=KafkaConfig)
    collectors: List[CollectorConfig] = Field(default_factory=list)
    transformers: List[TransformerConfig] = Field(default_factory=list)
    processors: List[ProcessorConfig] = Field(default_factory=list)
    consumers: List[ConsumerConfig] = Field(default_factory=list)


# ── Loader ────────────────────────────────────────────────────────────────────

def load_pipeline_config(path: str | Path) -> PipelineConfig:
    """Load and validate a pipeline YAML config file."""
    with open(path, "r") as f:
        raw = yaml.safe_load(f)
    return PipelineConfig(**raw)


def list_pipeline_configs(directory: str | Path) -> List[Path]:
    """Return all *.yaml files in the given directory."""
    return sorted(Path(directory).glob("*.yaml"))


def pipeline_id_from_path(path: str | Path) -> str:
    return Path(path).stem
