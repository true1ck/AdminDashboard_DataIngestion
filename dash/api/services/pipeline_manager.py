"""
Pipeline manager service.

Spawns pipeline processes from YAML configs, tracks their status,
and provides start/stop controls to the API layer.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

PIPELINES_DIR = Path(__file__).parent.parent.parent / "pipelines"
PROJECT_ROOT = Path(__file__).parent.parent.parent


class PipelineProcess:
    def __init__(self, pipeline_id: str, config_path: str):
        self.pipeline_id = pipeline_id
        self.config_path = config_path
        self.process: Optional[asyncio.subprocess.Process] = None
        self.started_at: Optional[datetime] = None
        self.task: Optional[asyncio.Task] = None

    @property
    def is_running(self) -> bool:
        return self.process is not None and self.process.returncode is None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pipeline_id": self.pipeline_id,
            "config_path": self.config_path,
            "status": "running" if self.is_running else "stopped",
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "pid": self.process.pid if self.process else None,
        }


class PipelineManager:
    def __init__(self):
        self._processes: Dict[str, PipelineProcess] = {}

    def list_configs(self) -> List[Dict[str, Any]]:
        configs = []
        if not PIPELINES_DIR.exists():
            return configs
        for yaml_file in sorted(PIPELINES_DIR.glob("*.yaml")):
            pipeline_id = yaml_file.stem
            proc = self._processes.get(pipeline_id)
            configs.append({
                "pipeline_id": pipeline_id,
                "config_path": str(yaml_file),
                "status": "running" if (proc and proc.is_running) else "stopped",
                "started_at": proc.started_at.isoformat() if (proc and proc.started_at) else None,
            })
        return configs

    def get_status(self, pipeline_id: str) -> Optional[Dict[str, Any]]:
        proc = self._processes.get(pipeline_id)
        if proc:
            return proc.to_dict()
        # Check if config exists
        config_path = PIPELINES_DIR / f"{pipeline_id}.yaml"
        if config_path.exists():
            return {"pipeline_id": pipeline_id, "status": "stopped", "config_path": str(config_path)}
        return None

    async def start(self, pipeline_id: str) -> Dict[str, Any]:
        config_path = PIPELINES_DIR / f"{pipeline_id}.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"No pipeline config found: {pipeline_id}.yaml")

        # Stop existing if running
        if pipeline_id in self._processes and self._processes[pipeline_id].is_running:
            await self.stop(pipeline_id)

        proc_entry = PipelineProcess(pipeline_id, str(config_path))

        env = os.environ.copy()
        env["PYTHONPATH"] = str(PROJECT_ROOT)

        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "engine.pipeline", str(config_path),
            cwd=str(PROJECT_ROOT),
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        proc_entry.process = proc
        proc_entry.started_at = datetime.utcnow()
        self._processes[pipeline_id] = proc_entry

        # Background task to log output
        async def _log_output():
            if proc.stdout:
                async for line in proc.stdout:
                    logger.info("[%s] %s", pipeline_id, line.decode().rstrip())

        asyncio.create_task(_log_output(), name=f"log:{pipeline_id}")
        logger.info("[manager] Started pipeline: %s (pid=%d)", pipeline_id, proc.pid)
        return proc_entry.to_dict()

    async def stop(self, pipeline_id: str) -> bool:
        proc_entry = self._processes.get(pipeline_id)
        if not proc_entry or not proc_entry.is_running:
            return False
        proc_entry.process.terminate()
        try:
            await asyncio.wait_for(proc_entry.process.wait(), timeout=10)
        except asyncio.TimeoutError:
            proc_entry.process.kill()
        logger.info("[manager] Stopped pipeline: %s", pipeline_id)
        return True

    async def stop_all(self):
        for pid in list(self._processes.keys()):
            await self.stop(pid)


# Singleton
pipeline_manager = PipelineManager()
