#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NetaBoard — Stop All Services
#  Kills all Node, React, Flask, and FastAPI processes running on assigned ports.
# ═══════════════════════════════════════════════════════════════

echo "🛑 Stopping all NetaBoard services..."

# Ports used by NetaBoard ecosystem
PORTS=(3000 4000 5001 6060 7070 8000 5180 5181 5555)

for PORT in "${PORTS[@]}"
do
  echo "Checking port $PORT..."
  
  if command -v lsof >/dev/null 2>&1; then
    # Mac/Linux approach
    PID=$(lsof -t -i:$PORT)
    if [ -n "$PID" ]; then
      echo "Killing process on port $PORT (PID: $PID)..."
      kill -9 $PID 2>/dev/null
    fi
  else
    # Windows/Git-Bash approach
    # findstr might return multiple lines if multiple processes or connections exist
    PIDS=$(netstat -ano | grep LISTENING | grep ":$PORT " | awk '{print $NF}' | sort -u)
    for PID in $PIDS
    do
      if [ -n "$PID" ] && [ "$PID" -gt 0 ]; then
        echo "Killing Windows process on port $PORT (PID: $PID)..."
        taskkill //F //PID $PID 2>/dev/null
      fi
    done
  fi
done

echo "✅ All services stopped (or checked)."
