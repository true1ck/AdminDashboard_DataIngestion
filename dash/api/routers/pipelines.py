"""
Pipelines router.

GET  /api/v1/pipelines              — list all pipeline configs
GET  /api/v1/pipelines/{id}         — get pipeline config
POST /api/v1/pipelines/{id}/start   — start pipeline
POST /api/v1/pipelines/{id}/stop    — stop pipeline
GET  /api/v1/pipelines/{id}/health  — get node health
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.services.pipeline_manager import pipeline_manager

router = APIRouter(prefix="/api/v1/pipelines", tags=["pipelines"])


@router.get("")
def list_pipelines():
    return pipeline_manager.list_configs()


@router.get("/{pipeline_id}")
def get_pipeline(pipeline_id: str):
    status = pipeline_manager.get_status(pipeline_id)
    if status is None:
        raise HTTPException(status_code=404, detail=f"Pipeline '{pipeline_id}' not found")
    return status


@router.post("/{pipeline_id}/start")
async def start_pipeline(pipeline_id: str):
    try:
        result = await pipeline_manager.start(pipeline_id)
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{pipeline_id}/stop")
async def stop_pipeline(pipeline_id: str):
    ok = await pipeline_manager.stop(pipeline_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Pipeline '{pipeline_id}' not running")
    return {"message": f"Pipeline '{pipeline_id}' stopped"}
