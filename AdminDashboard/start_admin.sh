#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NetaBoard Admin Dashboard — Startup Script
# ═══════════════════════════════════════════════════════════════

BASE="$(cd "$(dirname "$0")" && pwd)"

echo "Starting NetaBoard Admin Dashboard server..."
cd "$BASE"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the server
node server.js
