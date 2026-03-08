"""
Pipeline supervisor.

Monitors active pipelines, exposes health metrics, and can restart
failed nodes. Designed to run as a background asyncio task alongside
the FastAPI server.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional

from engine.pipeline import Pipeline

logger = logging.getLogger(__name__)


class Supervisor:
    """Manages a registry of active Pipeline instances."""

    def __init__(self):
        self._pipelines: Dict[str, Pipeline] = {}
        self._started_at: Dict[str, datetime] = {}

    def register(self, pipeline_id: str, pipeline: Pipeline):
        self._pipelines[pipeline_id] = pipeline
        self._started_at[pipeline_id] = datetime.utcnow()
        logger.info("[supervisor] Registered pipeline: %s", pipeline_id)

    def unregister(self, pipeline_id: str):
        self._pipelines.pop(pipeline_id, None)
        self._started_at.pop(pipeline_id, None)

    def is_running(self, pipeline_id: str) -> bool:
        return pipeline_id in self._pipelines

    def get_health(self, pipeline_id: str) -> Optional[dict]:
        p = self._pipelines.get(pipeline_id)
        if not p:
            return None
        nodes = p.get_health()
        started = self._started_at.get(pipeline_id)
        error_count = sum(n.get("errors", 0) for n in nodes.values())
        return {
            "pipeline_id": pipeline_id,
            "pipeline_name": p.name,
            "status": "running",
            "started_at": started.isoformat() if started else None,
            "node_count": len(nodes),
            "error_count": error_count,
            "nodes": nodes,
        }

    def get_all_health(self) -> dict:
        return {pid: self.get_health(pid) for pid in self._pipelines}

    async def stop_pipeline(self, pipeline_id: str) -> bool:
        p = self._pipelines.get(pipeline_id)
        if not p:
            return False
        await p.stop()
        self.unregister(pipeline_id)
        return True

    async def monitor_loop(self, interval_sec: int = 30):
        """Periodically log health summaries."""
        while True:
            await asyncio.sleep(interval_sec)
            for pid in list(self._pipelines.keys()):
                health = self.get_health(pid)
                if health:
                    nodes = health.get("nodes", {})
                    errored = [n for n, h in nodes.items() if h.get("status") == "error"]
                    logger.info(
                        "[supervisor] %s: %d nodes | errors=%d | errored_nodes=%s",
                        pid, len(nodes), health["error_count"], errored,
                    )


# Global supervisor instance (used by API)
supervisor = Supervisor()
