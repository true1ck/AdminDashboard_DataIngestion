"""
Pipeline orchestrator.

Reads YAML config, instantiates all nodes, wires Kafka topics,
and runs everything as concurrent asyncio tasks.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional

from core.config import PipelineConfig, load_pipeline_config
from core.kafka import Consumer, Producer
from engine.runner import (
    NodeHealth, run_collector, run_consumer,
    run_processor, run_transformer_chain,
)

logger = logging.getLogger(__name__)


class Pipeline:
    """Manages the full lifecycle of a named pipeline."""

    def __init__(self, config: PipelineConfig, config_path: Optional[str] = None):
        self.config = config
        self.config_path = config_path
        self.name = config.pipeline.name
        self._stop_event = asyncio.Event()
        self._tasks: List[asyncio.Task] = []
        self._health: Dict[str, NodeHealth] = {}
        self._producer: Optional[Producer] = None
        self._consumers: List[Consumer] = []

    async def start(self):
        cfg = self.config
        kafka_servers = cfg.kafka.bootstrap_servers
        topics = cfg.kafka.topics

        # Shared producer
        self._producer = Producer(kafka_servers)
        await self._producer.start()

        tasks = []

        # ── Collector nodes ──
        for col_cfg in cfg.collectors:
            if not col_cfg.enabled:
                continue
            for replica in range(col_cfg.replicas):
                node_id = f"{col_cfg.id}-{replica}"
                h = NodeHealth(node_id, "collector")
                self._health[node_id] = h
                t = asyncio.create_task(
                    run_collector(col_cfg, self._producer, topics["raw"], h, self._stop_event),
                    name=f"collector:{node_id}",
                )
                tasks.append(t)

        # ── Transformer chain (all transformers run sequentially in one task) ──
        enabled_tfms = [t for t in cfg.transformers if t.enabled]
        if enabled_tfms:
            # Determine replica count from the first transformer
            replicas = enabled_tfms[0].replicas
            for replica in range(replicas):
                chain_id = f"tfm-chain-{replica}"
                h = NodeHealth(chain_id, "transformer")
                self._health[chain_id] = h
                c = Consumer(
                    kafka_servers,
                    [topics["raw"]],
                    group_id=f"eip-tfm-chain-{replica}",
                )
                await c.start()
                self._consumers.append(c)
                t = asyncio.create_task(
                    run_transformer_chain(
                        enabled_tfms, c, self._producer,
                        topics["normalized"], h, self._stop_event,
                    ),
                    name=f"transformer:{chain_id}",
                )
                tasks.append(t)

        # ── Processor nodes ──
        for proc_cfg in cfg.processors:
            if not proc_cfg.enabled:
                continue
            for replica in range(proc_cfg.replicas):
                node_id = f"{proc_cfg.id}-{replica}"
                h = NodeHealth(node_id, "processor")
                self._health[node_id] = h
                c = Consumer(
                    kafka_servers,
                    [topics["normalized"]],
                    group_id=f"eip-proc-{proc_cfg.id}-{replica}",
                )
                await c.start()
                self._consumers.append(c)
                t = asyncio.create_task(
                    run_processor(proc_cfg, c, self._producer, topics["processed"], h, self._stop_event),
                    name=f"processor:{node_id}",
                )
                tasks.append(t)

        # ── Consumer nodes ──
        for con_cfg in cfg.consumers:
            if not con_cfg.enabled:
                continue
            for replica in range(con_cfg.replicas):
                node_id = f"{con_cfg.id}-{replica}"
                h = NodeHealth(node_id, "consumer")
                self._health[node_id] = h
                c = Consumer(
                    kafka_servers,
                    [topics["processed"]],
                    group_id=f"eip-con-{con_cfg.id}-{replica}",
                )
                await c.start()
                self._consumers.append(c)
                t = asyncio.create_task(
                    run_consumer(con_cfg, c, h, self._stop_event),
                    name=f"consumer:{node_id}",
                )
                tasks.append(t)

        self._tasks = tasks
        logger.info("[pipeline] %s started with %d tasks", self.name, len(tasks))

        # Await all tasks (run until stop or error)
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception) and not isinstance(r, asyncio.CancelledError):
                logger.error("[pipeline] Task error: %s", r)

    async def stop(self):
        logger.info("[pipeline] Stopping %s ...", self.name)
        self._stop_event.set()
        for c in self._consumers:
            c.stop()
        for t in self._tasks:
            t.cancel()
        if self._producer:
            await self._producer.stop()

    def get_health(self) -> Dict[str, dict]:
        return {nid: h.to_dict() for nid, h in self._health.items()}

    @classmethod
    def from_yaml(cls, path: str | Path) -> "Pipeline":
        cfg = load_pipeline_config(path)
        return cls(cfg, config_path=str(path))


async def run_pipeline(config_path: str):
    """Entry-point for running a pipeline from a YAML file."""
    pipeline = Pipeline.from_yaml(config_path)
    try:
        await pipeline.start()
    except KeyboardInterrupt:
        await pipeline.stop()


if __name__ == "__main__":
    import os
    logging.basicConfig(level=logging.INFO)
    path = sys.argv[1] if len(sys.argv) > 1 else "pipelines/entity_pipeline.yaml"
    # Add project root to sys.path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    asyncio.run(run_pipeline(path))
