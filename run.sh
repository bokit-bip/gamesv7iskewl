#!/usr/bin/env bash
# ==============================================================================
#  GAMES V7 — ONE-CLICK LAUNCH SCRIPT (LOCALHOST:8080)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PORT=8080

echo ""
echo "=========================================================="
echo "  🎮 GAMES V7 // SKELETAL FLOWERS LAUNCHER"
echo "=========================================================="
echo ""

# Check if port 8080 is occupied
if lsof -i :$PORT >/dev/null 2>&1; then
    echo "⚠️  Port $PORT is currently in use. Freeing port $PORT for Games V7..."
    fuser -k $PORT/tcp >/dev/null 2>&1 || kill -9 $(lsof -t -i:$PORT) >/dev/null 2>&1 || true
    sleep 1
    echo "✓ Port $PORT is now available."
fi

# Make sure server.js is executable
chmod +x "$DIR/server.js" 2>/dev/null || true

# Launch with Node.js or fallback to Python
if command -v node >/dev/null 2>&1; then
    echo "Starting Games V7 Node.js Server on port $PORT..."
    exec node "$DIR/server.js"
elif command -v python3 >/dev/null 2>&1; then
    echo "Starting Games V7 Python Server on port $PORT..."
    if command -v xdg-open >/dev/null 2>&1 && [ -n "$DISPLAY" ]; then
        (sleep 1 && xdg-open "http://localhost:$PORT/" >/dev/null 2>&1) &
    fi
    exec python3 -m http.server $PORT
else
    echo "❌ Error: Neither Node.js nor Python3 is installed on your system."
    exit 1
fi
