#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NetaBoard — Start All Services + Wait for Health
# ═══════════════════════════════════════════════════════════════

BASE="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║       NetaBoard — Starting All Services          ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""

# Make sure we stop old ones first
"${BASE}/stop_all.sh"
echo ""

open_tab() {
  local title="$1"
  local cmd="$2"
  osascript \
    -e 'tell application "Terminal"' \
    -e "  do script \"printf '\\\\033[1m[${title}]\\\\033[0m\\\\n' && ${cmd}\"" \
    -e '  activate' \
    -e 'end tell' > /dev/null 2>&1
}

wait_for_url() {
  local url=$1
  local name=$2
  echo -n -e "  Waiting for $name ($url) "
  while ! curl -s "$url" >/dev/null 2>&1; do
    echo -n "."
    sleep 1
  done
  echo -e " ${GREEN}Ready!${RESET}"
}

setup_python_venv() {
  local dir="$1"
  local req="$2"

  echo -e "  ${CYAN}→${RESET} Checking venv in ${dir##*/backend}..."
  if [ ! -d "${dir}/venv" ]; then
    echo "    Creating venv..."
    python3 -m venv "${dir}/venv"
  fi
  "${dir}/venv/bin/pip" install -q --upgrade pip > /dev/null 2>&1
  "${dir}/venv/bin/pip" install -q -r "${dir}/${req}" > /dev/null 2>&1
  echo -e "  ${GREEN}✓${RESET} Dependencies ready"
}

# 1. NetaBoardV5 Backend (Express)
echo -e "${GREEN}[1/4]${RESET} ${BOLD}NetaBoard Backend${RESET} → http://localhost:3000"
open_tab "NetaBoard Backend :3000" \
  "cd '${BASE}/NetaBoardV5/backend' && npm install --silent && npm run dev"
wait_for_url "http://localhost:3000/api/health" "NetaBoard Backend"

# 2. ImageToTextQwen (Flask)
echo -e "\n${GREEN}[2/4]${RESET} ${BOLD}ImageToTextQwen${RESET} → http://localhost:5001"
setup_python_venv "${BASE}/ImageToTextQwen/backend" "requirements.txt"
open_tab "ImageToTextQwen :5001" \
  "cd '${BASE}/ImageToTextQwen/backend' && source venv/bin/activate && python3 app.py"
wait_for_url "http://localhost:5001/api/health" "ImageToTextQwen"

# 3. MediaToTextWhisper (FastAPI)
echo -e "\n${GREEN}[3/4]${RESET} ${BOLD}MediaToTextWhisper${RESET} → http://localhost:8000"
setup_python_venv "${BASE}/MediaToTextWhisper/backend" "requirements.txt"
open_tab "MediaToTextWhisper :8000" \
  "cd '${BASE}/MediaToTextWhisper/backend' && source venv/bin/activate && python3 main.py"
wait_for_url "http://localhost:8000/api/health" "MediaToTextWhisper"

# 4. TwitterIngestionServer (Flask)
echo -e "\n${GREEN}[4/7]${RESET} ${BOLD}TwitterIngestionServer${RESET} → http://localhost:6060"
setup_python_venv "${BASE}/TwitterIngestionServer/backend" "requirements.txt"
open_tab "TwitterIngestionServer :6060" \
  "cd '${BASE}/TwitterIngestionServer/backend' && source venv/bin/activate && python3 app.py"
wait_for_url "http://localhost:6060/api/health" "TwitterIngestionServer"

# 5. FacebookIngestionServer (Flask)
echo -e "\n${GREEN}[5/7]${RESET} ${BOLD}FacebookIngestionServer${RESET} → http://localhost:7070"
setup_python_venv "${BASE}/FacebookIngestionServer/backend" "requirements.txt"
open_tab "FacebookIngestionServer :7070" \
  "cd '${BASE}/FacebookIngestionServer/backend' && source venv/bin/activate && python3 app.py"
wait_for_url "http://localhost:7070/api/health" "FacebookIngestionServer"

# 6. AdminDashboard Server (Express)
echo -e "\n${GREEN}[6/7]${RESET} ${BOLD}Admin Dashboard${RESET} → http://localhost:4000"
open_tab "Admin Dashboard :4000" \
  "cd '${BASE}/AdminDashboard' && npm install --silent && node server.js"
wait_for_url "http://localhost:4000/api/health" "AdminDashboard"

# 7. NetaBoardV5 Frontend (Vite)
echo -e "\n${GREEN}[7/7]${RESET} ${BOLD}NetaBoard Frontend${RESET} → http://localhost:5180"
open_tab "NetaBoard Frontend :5180" \
  "cd '${BASE}/NetaBoardV5' && npm install --silent && npm run dev"

# 8. Prisma Studio (DB Viewer)
echo -e "\n${GREEN}[8/8]${RESET} ${BOLD}Prisma Studio (DB Viewer)${RESET} → http://localhost:5555"
open_tab "Prisma Studio :5555" \
  "cd '${BASE}/NetaBoardV5/backend' && npx prisma studio --port 5555 --browser none"
wait_for_url "http://localhost:5555" "Prisma Studio"

echo ""
echo -e "${BOLD}${CYAN}All services launched!${RESET}"
echo ""
echo -e "  ${CYAN}●${RESET} Admin Dashboard → ${YELLOW}http://localhost:4000${RESET}"
echo -e "  ${CYAN}●${RESET} NetaBoard App   → ${YELLOW}http://localhost:5180${RESET}"
echo -e "  ${CYAN}●${RESET} DB Viewer       → ${YELLOW}http://localhost:5555${RESET}"
echo ""

# Give frontend a couple seconds to boot up
sleep 3
open "http://localhost:4000"
open "http://localhost:5180"
open "http://localhost:5555"
