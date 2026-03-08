"""
Entity Intelligence Pipeline — Dashboard API Server

Runs on port 8500. Provides:
- Live event feed (SSE + polling)
- Pipeline management (start/stop/status)
- Entity collection trigger
- Health endpoint
"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is in path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from api.routers.events import router as events_router
from api.routers.entities import router as entities_router
from api.routers.pipelines import router as pipelines_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Entity Intelligence Pipeline API",
    description="Real-time data collection and monitoring for entity intelligence.",
    version="1.0.0",
)

# CORS — allow NetaBoardV5 (5180) and AdminDashboard (4000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5180", "http://localhost:4000", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(entities_router)
app.include_router(pipelines_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "entity-intelligence-pipeline"}


@app.get("/api/v1/health/all")
def health_all():
    """Compatible with NetaBoardV5 ServiceStatusBar format."""
    return {
        "backend": "online",
        "pipeline": "online",
    }


@app.on_event("startup")
async def startup():
    from engine.supervisor import supervisor
    asyncio.create_task(supervisor.monitor_loop(), name="supervisor")
    logging.getLogger(__name__).info("Pipeline API server started on :8500")


@app.on_event("shutdown")
async def shutdown():
    from api.services.pipeline_manager import pipeline_manager
    await pipeline_manager.stop_all()


if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8500,
        reload=True,
        log_level="info",
    )
