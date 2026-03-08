"""
Entities router.

POST /api/v1/entities   — trigger data collection for a named entity
GET  /api/v1/entities   — list active entity collection jobs

Pipeline stages for ad-hoc collection:
  collector   → raw fetch events (article/tweet/video fetched)
  transformer → normalise + deduplicate
  processor   → sentiment analysis + NER
  consumer    → stored to live feed / downstream storage
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from api.services.event_store import event_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/entities", tags=["entities"])

# Active in-process collection jobs {entity_key: task}
_active_jobs: Dict[str, asyncio.Task] = {}


class CollectRequest(BaseModel):
    entity: str
    sources: List[str] = ["youtube", "news_rss"]
    count: int = 5
    pipeline_id: Optional[str] = None
    once: bool = True


class JobStatus(BaseModel):
    entity: str
    sources: List[str]
    status: str
    pipeline_id: Optional[str] = None


@router.post("", status_code=202)
async def trigger_collection(req: CollectRequest, background_tasks: BackgroundTasks):
    """Start data collection for an entity across requested sources."""
    key = f"{req.entity}::{','.join(req.sources)}"

    if key in _active_jobs and not _active_jobs[key].done():
        return {"message": "Collection already running", "entity": req.entity, "status": "running"}

    event_store.push({
        "pipeline_id": req.pipeline_id,
        "stage": "collector",
        "event_type": "audit",
        "entity": req.entity,
        "text": f"Started collection for '{req.entity}' from: {', '.join(req.sources)}",
        "metadata": {"sources": req.sources, "count": req.count},
    })

    task = asyncio.create_task(
        _run_collection(req),
        name=f"collect:{req.entity}",
    )
    _active_jobs[key] = task

    return {
        "message": "Collection started",
        "entity": req.entity,
        "sources": req.sources,
        "status": "running",
    }


@router.get("")
def list_jobs():
    return [
        {"key": key, "done": task.done(), "cancelled": task.cancelled()}
        for key, task in _active_jobs.items()
    ]


async def _run_collection(req: CollectRequest):
    for source in req.sources:
        try:
            await _collect_source(source, req)
        except Exception as exc:
            logger.error("[entities] Collection error for %s/%s: %s", req.entity, source, exc)
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "collector",
                "event_type": "error",
                "entity": req.entity,
                "error_message": str(exc),
                "metadata": {"source": source},
            })


async def _collect_source(source: str, req: CollectRequest):
    """
    Runs the full collector → transformer → processor → consumer chain
    in-process (no Kafka), emitting stage events to the live feed at each step.
    """
    import importlib

    # ── Load collector plugin ──────────────────────────────────────────────────
    try:
        mod = importlib.import_module(f"collectors.{source}")
        cls_name = source.title().replace("_", "") + "Collector"
        cls = getattr(mod, cls_name)
    except (ImportError, AttributeError):
        logger.warning("[entities] No collector for source: %s", source)
        event_store.push({
            "pipeline_id": req.pipeline_id,
            "stage": "collector",
            "event_type": "error",
            "entity": req.entity,
            "platform": source,
            "text": f"No collector plugin found for source '{source}'",
        })
        return

    collector = cls()
    collector.configure(
        {"max_results": req.count, "once": True, "poll_interval_sec": 60},
        entity=req.entity,
    )

    # ── Instantiate transformer + processor plugins once ──────────────────────
    from transformers.normalizer import NormalizerTransformer
    from transformers.deduplicator import DeduplicatorTransformer
    from processors.sentiment import SentimentProcessor
    from processors.ner import NerProcessor

    normalizer = NormalizerTransformer()
    normalizer.configure({})

    deduplicator = DeduplicatorTransformer()
    deduplicator.configure({})

    sentiment_proc = SentimentProcessor()
    sentiment_proc.configure({})

    ner_proc = NerProcessor()
    ner_proc.configure({})

    topic = f"{req.entity.replace(' ', '')}_{source.replace('_rss', '').title()}"

    # COLLECTOR trace — collection starting
    event_store.push({
        "pipeline_id": req.pipeline_id,
        "stage": "collector",
        "event_type": "trace",
        "entity": req.entity,
        "platform": source,
        "topic": topic,
        "text": f"Collecting from {source} for '{req.entity}'…",
    })

    items_collected = 0

    async for raw_item in collector.stream():
        # ── COLLECTOR: raw item fetched ────────────────────────────────────────
        p = raw_item.raw_payload
        raw_title = (
            p.get("title") or p.get("text") or p.get("caption") or ""
        )[:120]
        raw_url = p.get("link") or p.get("webpage_url") or p.get("url") or ""

        event_store.push({
            "pipeline_id": req.pipeline_id,
            "stage": "collector",
            "event_type": "raw_fetch",
            "entity": req.entity,
            "platform": source,
            "topic": topic,
            "text": f"Fetched: {raw_title}",
            "metadata": {
                "url": raw_url,
                "platform_item_id": raw_item.platform_item_id,
                "content_type": p.get("content_type", "unknown"),
            },
        })

        items_collected += 1

        # ── TRANSFORMER: normalise ─────────────────────────────────────────────
        normalized = None
        try:
            normalized = await normalizer.transform(raw_item)
        except Exception as exc:
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "transformer",
                "event_type": "error",
                "entity": req.entity,
                "platform": source,
                "error_message": f"Normaliser error: {exc}",
            })
            if items_collected >= req.count:
                break
            continue

        if normalized is None:
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "transformer",
                "event_type": "drop",
                "entity": req.entity,
                "platform": source,
                "text": "Normalisation returned nothing — item dropped",
            })
            if items_collected >= req.count:
                break
            continue

        event_store.push({
            "pipeline_id": req.pipeline_id,
            "stage": "transformer",
            "event_type": "normalized",
            "entity": req.entity,
            "platform": source,
            "topic": normalized.topic or topic,
            "text": (
                f"Normalised [{normalized.content_type}] "
                f"{len(normalized.text or '')} chars · author: {normalized.author or '—'}"
            ),
        })

        # ── TRANSFORMER: deduplicate ───────────────────────────────────────────
        try:
            deduped = await deduplicator.transform(normalized)
        except Exception:
            deduped = normalized

        if deduped is None:
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "transformer",
                "event_type": "dedup_drop",
                "entity": req.entity,
                "platform": source,
                "topic": normalized.topic or topic,
                "text": "Duplicate item — skipped",
            })
            if items_collected >= req.count:
                break
            continue

        normalized = deduped

        # ── PROCESSOR: sentiment ───────────────────────────────────────────────
        analysis: Dict[str, Any] = {}
        try:
            sentiment_result = await sentiment_proc.process(normalized)
            analysis.update(sentiment_result)
            label = sentiment_result.get("sentiment_label", "neutral")
            score = sentiment_result.get("sentiment", 0.0)
            is_threat = sentiment_result.get("is_threat", False)
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "processor",
                "event_type": "sentiment",
                "entity": req.entity,
                "platform": source,
                "topic": normalized.topic or topic,
                "sentiment": score,
                "sentiment_label": label,
                "is_threat": is_threat,
                "text": (
                    f"Sentiment: {label} ({score:+.2f})"
                    + (" ⚠ THREAT SIGNAL" if is_threat else "")
                ),
            })
        except Exception as exc:
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "processor",
                "event_type": "error",
                "entity": req.entity,
                "platform": source,
                "error_message": f"Sentiment error: {exc}",
            })

        # ── PROCESSOR: NER ─────────────────────────────────────────────────────
        entities_found: list = []
        try:
            ner_result = await ner_proc.process(normalized)
            entities_found = ner_result.get("entities", [])
            analysis.update(ner_result)
            entity_texts = [e.text for e in entities_found[:5]]
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "processor",
                "event_type": "ner",
                "entity": req.entity,
                "platform": source,
                "topic": normalized.topic or topic,
                "entities": entity_texts,
                "text": (
                    f"NER: {len(entities_found)} entities found"
                    + (f" — {', '.join(entity_texts[:3])}" if entity_texts else "")
                ),
            })
        except Exception as exc:
            event_store.push({
                "pipeline_id": req.pipeline_id,
                "stage": "processor",
                "event_type": "error",
                "entity": req.entity,
                "platform": source,
                "error_message": f"NER error: {exc}",
            })

        # ── CONSUMER: store to live feed ───────────────────────────────────────
        event_store.push({
            "pipeline_id": req.pipeline_id,
            "stage": "consumer",
            "event_type": "stored",
            "entity": req.entity,
            "platform": source,
            "topic": normalized.topic or topic,
            "author": normalized.author or "",
            "sentiment": analysis.get("sentiment"),
            "sentiment_label": analysis.get("sentiment_label"),
            "entities": [e.text for e in entities_found[:5]],
            "is_threat": analysis.get("is_threat", False),
            "text": (normalized.text or "")[:300],
            "metadata": {
                "content_type": normalized.content_type,
                "dedup_hash": normalized.dedup_hash,
                "media_urls": normalized.media_urls[:2],
            },
        })

        if items_collected >= req.count:
            break

    # ── COLLECTOR: final audit ─────────────────────────────────────────────────
    event_store.push({
        "pipeline_id": req.pipeline_id,
        "stage": "collector",
        "event_type": "audit",
        "entity": req.entity,
        "platform": source,
        "topic": topic,
        "text": f"Done — collected {items_collected} items from {source} for '{req.entity}'",
    })
