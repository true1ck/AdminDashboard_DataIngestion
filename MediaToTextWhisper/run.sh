#!/bin/bash
# MediaToText — Quick Start Script

set -e

echo "🎬 MediaToText — Starting..."
echo ""

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found. Install it with:"
    echo "   brew install ffmpeg"
    exit 1
fi

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create virtual environment if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
python3 -m pip install -r backend/requirements.txt --quiet

echo ""
echo "🚀 Starting server at http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""

# Run server
cd backend
python3 main.py
