#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NetaBoard — Start All Services + Wait for Health (Windows)
# ═══════════════════════════════════════════════════════════════

BASE="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-90}

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║   NetaBoard — Starting All Services (Windows)    ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

venv_bin_dir() {
  local dir="$1"
  if [ -d "${dir}/venv/bin" ]; then
    echo "${dir}/venv/bin"
  elif [ -d "${dir}/venv/Scripts" ]; then
    echo "${dir}/venv/Scripts"
  else
    echo ""
  fi
}

open_tab() {
  local title="$1"
  local cmd="$2"
  echo ""
  echo -e "${BOLD}${YELLOW}[${title}]${RESET}"
  ( eval "$cmd" ) &
}

wait_for_url() {
  local url=$1
  local name=$2
  local timeout="${3:-$HEALTH_TIMEOUT}"
  local start_ts

  if command_exists date; then
    start_ts=$(date +%s)
  else
    start_ts=0
  fi

  echo -n -e "  Waiting for $name ($url) "
  while ! curl -s "$url" >/dev/null 2>&1; do
    echo -n "."
    sleep 1
    if [ "$start_ts" -ne 0 ] && [ "$timeout" -gt 0 ]; then
      local now_ts
      now_ts=$(date +%s)
      if [ $((now_ts - start_ts)) -ge "$timeout" ]; then
        echo -e " ${YELLOW}Timed out after ${timeout}s.${RESET}"
        echo -e "  ${YELLOW}Hint:${RESET} Check logs for '$name' in the terminal output."
        return 1
      fi
    fi
  done
  echo -e " ${GREEN}Ready!${RESET}"
}

ensure_prisma_db_ready() {
  # Only needed on Windows; mac leaves Prisma management manual in start_all.sh.

  # If DB and client already exist, skip Prisma commands.
  if [ -f "${BASE}/NetaBoardV5/backend/prisma/dev.db" ] && \
     [ -d "${BASE}/NetaBoardV5/backend/node_modules/@prisma/client" ]; then
    echo -e "  ${GREEN}✓${RESET} Prisma already set up (Windows); skipping db push/generate."
    return 0
  fi

  echo -e "  ${CYAN}→${RESET} Ensuring Prisma database & client are ready (Windows)..."
  (
    cd "${BASE}/NetaBoardV5/backend" || exit 1
    echo "    Running: npx prisma db push"
    npx prisma db push || exit 1

    echo "    Running: npx prisma generate"
    npx prisma generate || exit 1

    if [ "${SEED_DB:-0}" != "0" ]; then
      echo "    SEED_DB is set; running seed script..."
      npx ts-node prisma/seed.ts || exit 1
    fi
  )

  local status=$?
  if [ "$status" -ne 0 ]; then
    echo -e "    ${YELLOW}Error:${RESET} Prisma setup failed on Windows (db push / generate / seed)."
    return "$status"
  fi

  echo -e "  ${GREEN}✓${RESET} Prisma ready (Windows)."
  return 0
}

setup_python_venv() {
  local dir="$1"
  local req="$2"

  echo -e "  ${CYAN}→${RESET} Checking venv in ${dir##*/backend}..."
  if [ ! -d "${dir}/venv" ]; then
    local py_exec="python3"
    if ! command_exists "$py_exec"; then
      py_exec="python"
    fi

    if ! command_exists "$py_exec"; then
      echo "    ${YELLOW}Error:${RESET} Could not find python3 or python in PATH."
      return 1
    fi

    echo "    Creating venv with ${py_exec}..."
    "$py_exec" -m venv "${dir}/venv" || {
      echo "    ${YELLOW}Error:${RESET} Failed to create virtual environment in ${dir}/venv."
      return 1
    }
  fi

  local VENV_BIN
  VENV_BIN="$(venv_bin_dir "${dir}")"
  if [ -z "${VENV_BIN}" ]; then
    echo "    ${YELLOW}Error:${RESET} Could not locate venv bin/Scripts directory under ${dir}/venv."
    return 1
  fi

  # Find the Python executable inside the venv (handles both Unix and Windows layouts)
  local VENV_PY
  if [ -x "${VENV_BIN}/python" ]; then
    VENV_PY="${VENV_BIN}/python"
  elif [ -x "${VENV_BIN}/python.exe" ]; then
    VENV_PY="${VENV_BIN}/python.exe"
  else
    echo "    ${YELLOW}Error:${RESET} Could not find python/python.exe in ${VENV_BIN}."
    return 1
  fi

  echo -e "  ${CYAN}→${RESET} Installing Python dependencies from ${req}..."
  "${VENV_PY}" -m pip install --upgrade pip || {
    echo -e "    ${YELLOW}Error:${RESET} Failed to upgrade pip in venv (${VENV_BIN})."
    echo -e "    ${YELLOW}Hint:${RESET} Try running: \"${VENV_PY}\" -m pip install --upgrade pip"
    return 1
  }
  "${VENV_PY}" -m pip install -r "${dir}/${req}" || {
    echo -e "    ${YELLOW}Error:${RESET} Failed to install Python dependencies from ${req}."
    echo -e "    ${YELLOW}Hint:${RESET} Try running: \"${VENV_PY}\" -m pip install -r \"${dir}/${req}\""
    return 1
  }
  echo -e "  ${GREEN}✓${RESET} Dependencies ready (venv: ${VENV_BIN})"
}

open_url() {
  local url="$1"
  # On Windows we’ll prefer explorer / start, but fall back gracefully.
  if command_exists explorer.exe; then
    explorer.exe "$url" >/dev/null 2>&1 &
  else
    cmd.exe /c start "" "$url" >/dev/null 2>&1
  fi
}

echo -e "  ${CYAN}→${RESET} Stopping any existing services (if stop_all.sh exists)..."
if [ -f "${BASE}/stop_all.sh" ]; then
  bash "${BASE}/stop_all.sh"
else
  echo -e "  ${YELLOW}Warning:${RESET} No stop_all.sh script found; skipping graceful shutdown."
fi
echo ""

# 1. NetaBoardV5 Backend (Express)
echo -e "${GREEN}[1/4]${RESET} ${BOLD}NetaBoard Backend${RESET} → http://localhost:3000"
if ! ensure_prisma_db_ready; then
  echo -e "  ${YELLOW}Warning:${RESET} Prisma setup failed; skipping NetaBoard Backend start."
else
  open_tab "NetaBoard Backend :3000" \
    "cd '${BASE}/NetaBoardV5/backend' && npm install --silent && npm run dev"
  wait_for_url "http://localhost:3000/api/health" "NetaBoard Backend" "$HEALTH_TIMEOUT"
fi

# 2. ImageToTextQwen (Flask)
echo -e "\n${GREEN}[2/4]${RESET} ${BOLD}ImageToTextQwen${RESET} → http://localhost:5001"
setup_python_venv "${BASE}/ImageToTextQwen/backend" "requirements.txt"
IMAGE_TO_TEXT_BACKEND="${BASE}/ImageToTextQwen/backend"
IMAGE_TO_TEXT_VENV_BIN="$(venv_bin_dir "${IMAGE_TO_TEXT_BACKEND}")"
if [ -z "${IMAGE_TO_TEXT_VENV_BIN}" ]; then
  echo -e "  ${YELLOW}Error:${RESET} ImageToTextQwen venv not found; skipping service start."
else
  open_tab "ImageToTextQwen :5001" \
    "cd '${IMAGE_TO_TEXT_BACKEND}' && source '${IMAGE_TO_TEXT_VENV_BIN}/activate' && python app.py"
  wait_for_url "http://localhost:5001/api/health" "ImageToTextQwen" "$HEALTH_TIMEOUT"
fi

# 3. MediaToTextWhisper (FastAPI)
echo -e "\n${GREEN}[3/4]${RESET} ${BOLD}MediaToTextWhisper${RESET} → http://localhost:8000"
setup_python_venv "${BASE}/MediaToTextWhisper/backend" "requirements.txt"
MEDIA_TO_TEXT_BACKEND="${BASE}/MediaToTextWhisper/backend"
MEDIA_TO_TEXT_VENV_BIN="$(venv_bin_dir "${MEDIA_TO_TEXT_BACKEND}")"
if [ -z "${MEDIA_TO_TEXT_VENV_BIN}" ]; then
  echo -e "  ${YELLOW}Error:${RESET} MediaToTextWhisper venv not found; skipping service start."
else
  open_tab "MediaToTextWhisper :8000" \
    "cd '${MEDIA_TO_TEXT_BACKEND}' && source '${MEDIA_TO_TEXT_VENV_BIN}/activate' && python main.py"
  wait_for_url "http://localhost:8000/api/health" "MediaToTextWhisper" "$HEALTH_TIMEOUT"
fi

# 4. AdminDashboard Server (Express)
echo -e "\n${GREEN}[4/5]${RESET} ${BOLD}Admin Dashboard${RESET} → http://localhost:4000"
open_tab "Admin Dashboard :4000" \
  "cd '${BASE}/AdminDashboard' && npm install --silent && node server.js"
wait_for_url "http://localhost:4000/api/health" "AdminDashboard"

# 5. NetaBoardV5 Frontend (Vite)
echo -e "\n${GREEN}[5/5]${RESET} ${BOLD}NetaBoard Frontend${RESET} → http://localhost:5180"
open_tab "NetaBoard Frontend :5180" \
  "cd '${BASE}/NetaBoardV5' && npm install --silent && npm run dev"

echo ""
echo -e "${BOLD}${CYAN}All services launched (Windows)!${RESET}"
echo ""
echo -e "  ${CYAN}●${RESET} Admin Dashboard → ${YELLOW}http://localhost:4000${RESET}"
echo -e "  ${CYAN}●${RESET} NetaBoard App   → ${YELLOW}http://localhost:5180${RESET}"
echo ""

# Give frontend a couple seconds to boot up, then open in browser
sleep 3
open_url "http://localhost:4000"
open_url "http://localhost:5180"

