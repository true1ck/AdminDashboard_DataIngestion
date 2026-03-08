#!/usr/bin/env bash
# ── Run a quick in-memory demo of the pipeline ────────────────────────────
# No Kafka, Postgres, or Qdrant required.
# Collects data about the given entity and logs results to stdout.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VENV="${PROJECT_ROOT}/.venv"

if [ ! -d "${VENV}" ]; then
  echo "[demo.sh] Creating virtual environment..."
  python3 -m venv "${VENV}"
  source "${VENV}/bin/activate"
  pip install -q -r "${PROJECT_ROOT}/requirements.txt"
  python -m spacy download en_core_web_sm 2>/dev/null || true
else
  source "${VENV}/bin/activate"
fi

ENTITY="${1:-Rahul Gandhi}"
PIPELINE="${2:-${PROJECT_ROOT}/pipelines/entity_pipeline.yaml}"

echo ""
echo "════════════════════════════════════════════════════"
echo "  Entity Intelligence Pipeline — Demo"
echo "  Entity : ${ENTITY}"
echo "  Config : ${PIPELINE}"
echo "════════════════════════════════════════════════════"
echo ""

cd "${PROJECT_ROOT}"
PYTHONPATH="${PROJECT_ROOT}" python - <<PYEOF
import asyncio, sys, logging
sys.path.insert(0, '${PROJECT_ROOT}')

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

from core.config import load_pipeline_config
from engine.pipeline import Pipeline

async def main():
    cfg = load_pipeline_config('${PIPELINE}')
    # Override entity if provided via CLI
    entity = '${ENTITY}'
    if entity:
        cfg.pipeline.entity = entity
        for col in cfg.collectors:
            col.entity = entity

    pipeline = Pipeline(cfg)
    try:
        await asyncio.wait_for(pipeline.start(), timeout=120)
    except asyncio.TimeoutError:
        print("\\n[demo] Timeout reached — stopping pipeline.")
        await pipeline.stop()

asyncio.run(main())
PYEOF
