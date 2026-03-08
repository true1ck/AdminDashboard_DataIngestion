#!/bin/bash
# NetaBoard Admin Dashboard — Startup Script

BASE="$(cd "$(dirname "$0")" && pwd)"

echo "Starting NetaBoard Admin Dashboard server..."
cd "$BASE"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

node server.js
