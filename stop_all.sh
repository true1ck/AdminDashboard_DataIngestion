#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NetaBoard — Stop All Services
#  Kills all Node, React, Flask, and FastAPI processes running on assigned ports.
# ═══════════════════════════════════════════════════════════════

echo "🛑 Stopping all NetaBoard services..."

# Ports used by NetaBoard ecosystem
PORTS=(3000 5001 5180 8000)

for PORT in "${PORTS[@]}"
do
  PID=$(lsof -t -i:$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)..."
    kill -9 $PID 2>/dev/null
  fi
done

echo "✅ All services stopped."
