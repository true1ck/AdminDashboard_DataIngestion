#!/usr/bin/env bash
# ── Start the Entity Intelligence Pipeline API server ──────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Create virtual env if missing ──────────────────────────────────────────
VENV="${PROJECT_ROOT}/.venv"
if [ ! -d "${VENV}" ]; then
  echo "[run.sh] Creating virtual environment..."
  python3 -m venv "${VENV}"
fi

source "${VENV}/bin/activate"

# ── Install dependencies ────────────────────────────────────────────────────
echo "[run.sh] Installing requirements..."
pip install -q -r "${PROJECT_ROOT}/requirements.txt"

# ── Download spaCy model if needed ─────────────────────────────────────────
python -c "import spacy; spacy.load('en_core_web_sm')" 2>/dev/null || \
  python -m spacy download en_core_web_sm

# ── Start API server ────────────────────────────────────────────────────────
PORT="${1:-8500}"
echo "[run.sh] Starting Pipeline API on :${PORT}..."
cd "${PROJECT_ROOT}"
PYTHONPATH="${PROJECT_ROOT}" python -m uvicorn api.main:app \
  --host 0.0.0.0 \
  --port "${PORT}" \
  --reload \
  --log-level info
