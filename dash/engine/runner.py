"""
Async node runner.

Each pipeline stage (collector, transformer, processor, consumer) is run
as an asyncio task that reads from a source topic/queue and writes to a
destination topic/queue.
"""

from __future__ import annotations

import asyncio
import importlib
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from core.config import (
    CollectorConfig, ConsumerConfig, PipelineConfig,
    ProcessorConfig, TransformerConfig,
)
from core.kafka import Consumer, Producer
from core.schemas import NormalizedItem, ProcessedItem, ProcessingMeta, RawItem

logger = logging.getLogger(__name__)


def _load_plugin(package: str, type_name: str, class_suffix: str):
    """Dynamically load a plugin class from a package by type name."""
    module_name = f"{package}.{type_name.lower()}"
    class_name = type_name.title().replace("_", "") + class_suffix
    try:
        mod = importlib.import_module(module_name)
        return getattr(mod, class_name)
    except (ImportError, AttributeError) as exc:
        raise ImportError(f"Cannot load plugin {module_name}.{class_name}: {exc}") from exc


# ── Node health tracking ──────────────────────────────────────────────────────

class NodeHealth:
    def __init__(self, node_id: str, node_type: str):
        self.node_id = node_id
        self.node_type = node_type
        self.status = "starting"
        self.items_in = 0
        self.items_out = 0
        self.errors = 0
        self.last_item_at: Optional[datetime] = None
        self.started_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "node_type": self.node_type,
            "status": self.status,
            "items_in": self.items_in,
            "items_out": self.items_out,
            "errors": self.errors,
            "last_item_at": self.last_item_at.isoformat() if self.last_item_at else None,
            "started_at": self.started_at.isoformat(),
        }


# ── Collector runner ──────────────────────────────────────────────────────────

async def run_collector(
    cfg: CollectorConfig,
    producer: Producer,
    raw_topic: str,
    health: NodeHealth,
    stop: asyncio.Event,
):
    cls = _load_plugin("collectors", cfg.platform, "Collector")
    adapter = cls()
    adapter.configure(
        {**cfg.config, **cfg.who.model_dump(), **cfg.what.model_dump(),
         "poll_interval_sec": cfg.when.poll_interval_sec,
         "max_results": cfg.who.max_results,
         "once": cfg.when.mode == "once"},
        entity=cfg.entity,
        event=cfg.event,
    )
    health.status = "running"
    logger.info("[runner] Collector %s started (entity=%s)", cfg.id, cfg.entity)
    try:
        async for raw_item in adapter.stream():
            if stop.is_set():
                break
            payload = raw_item.model_dump(mode="json")
            await producer.send(raw_topic, payload)
            health.items_out += 1
            health.last_item_at = datetime.utcnow()
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        health.errors += 1
        health.status = "error"
        logger.error("[runner] Collector %s error: %s", cfg.id, exc)
        raise
    finally:
        health.status = "stopped"


# ── Transformer chain runner ──────────────────────────────────────────────────
# Chains all transformers sequentially in a single task so each transformer
# receives the output of the previous one (RawItem → NormalizedItem → …).

async def run_transformer_chain(
    cfgs: List[TransformerConfig],
    consumer: Consumer,
    producer: Producer,
    out_topic: str,
    health: NodeHealth,
    stop: asyncio.Event,
):
    """Run a list of transformers as an ordered pipeline stage chain."""
    # Load and configure all plugins once
    plugins = []
    for cfg in cfgs:
        cls = _load_plugin("transformers", cfg.type, "Transformer")
        plugin = cls()
        plugin.configure(cfg.config)
        plugins.append((cfg.id, plugin))

    health.status = "running"
    logger.info("[runner] Transformer chain started: %s", [c.id for c in cfgs])
    try:
        async for msg in consumer.stream():
            if stop.is_set():
                break
            health.items_in += 1
            try:
                # First plugin always receives a RawItem
                item = RawItem(**msg)
                for node_id, plugin in plugins:
                    if item is None:
                        break
                    item = await plugin.transform(item)
                if item is not None:
                    await producer.send(out_topic, item.model_dump(mode="json"))
                    health.items_out += 1
                    health.last_item_at = datetime.utcnow()
            except Exception as exc:
                health.errors += 1
                logger.error("[runner] Transformer chain item error: %s", exc)
    except asyncio.CancelledError:
        pass
    finally:
        health.status = "stopped"


# ── Processor runner ──────────────────────────────────────────────────────────

async def run_processor(
    cfg: ProcessorConfig,
    consumer: Consumer,
    producer: Producer,
    out_topic: str,
    health: NodeHealth,
    stop: asyncio.Event,
):
    cls = _load_plugin("processors", cfg.type, "Processor")
    plugin = cls()
    plugin.configure(cfg.config)
    health.status = "running"
    logger.info("[runner] Processor %s started", cfg.id)
    try:
        async for msg in consumer.stream():
            if stop.is_set():
                break
            health.items_in += 1
            try:
                norm = NormalizedItem(**msg)
                t0 = time.monotonic()
                try:
                    analysis = await asyncio.wait_for(plugin.process(norm), timeout=cfg.timeout_sec)
                except asyncio.TimeoutError:
                    analysis = await plugin.fallback(norm)

                base = norm.model_dump(mode="json")
                base.update(analysis)

                proc_meta = base.get("processing_meta") or {}
                if isinstance(proc_meta, dict):
                    proc_meta.setdefault("processors_applied", [])
                    proc_meta["processors_applied"].append(cfg.id)
                    proc_meta["total_processing_ms"] = int((time.monotonic() - t0) * 1000)
                base["processing_meta"] = proc_meta

                await producer.send(out_topic, base)
                health.items_out += 1
                health.last_item_at = datetime.utcnow()
            except Exception as exc:
                health.errors += 1
                logger.error("[runner] Processor %s item error: %s", cfg.id, exc)
    except asyncio.CancelledError:
        pass
    finally:
        health.status = "stopped"


# ── Consumer runner ───────────────────────────────────────────────────────────

async def run_consumer(
    cfg: ConsumerConfig,
    consumer: Consumer,
    health: NodeHealth,
    stop: asyncio.Event,
):
    cls = _load_plugin("consumers", cfg.type, "Consumer")
    plugin = cls()
    plugin.configure({**cfg.config, "pipeline_id": health.node_id.split("-")[0]})
    health.status = "running"
    logger.info("[runner] Consumer %s started", cfg.id)
    try:
        async for msg in consumer.stream():
            if stop.is_set():
                break
            health.items_in += 1
            try:
                item = ProcessedItem(**msg)
                await plugin.consume(item)
                health.items_out += 1
                health.last_item_at = datetime.utcnow()
            except Exception as exc:
                health.errors += 1
                logger.error("[runner] Consumer %s item error: %s", cfg.id, exc)
    except asyncio.CancelledError:
        pass
    finally:
        health.status = "stopped"
