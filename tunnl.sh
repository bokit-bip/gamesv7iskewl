#!/usr/bin/env bash
# ==============================================================================
#  GAMES V7 — 24/7 PERSISTENT TUNNL.GG LAUNCHER
#  Keeps public links alive indefinitely (bypasses 2h idle timeout & 24h cap)
# ==============================================================================

set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"
SSH_KEY="$HOME/.ssh/id_ed25519"
KEEP_ALIVE_PID=""
SSH_PID=""

# Color Escapes
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${RED}${BOLD}"
cat << 'EOF'
  ██████╗  █████╗ ███╗   ███╗███████╗███████╗    ██╗   ██╗███████╗
 ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██╔════╝    ██║   ██║╚════██║
 ██║  ███╗███████║██╔████╔██║█████╗  ███████╗    ██║   ██║    ██╔╝
 ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ╚════██║    ╚██╗ ██╔╝   ██╔╝ 
 ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████║     ╚████╔╝    ██║  
  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝      ╚═══╝     ╚═╝  
EOF
echo -e "${CYAN}${BOLD}     ⚡ 24/7 PERSISTENT REVERSE PROXY TUNNEL (tunnl.gg) ⚡${NC}"
echo -e "${PURPLE}     ────────────────────────────────────────────────────────${NC}\n"

# 1. Ensure Persistent SSH Key Exists
# (Tunnl.gg uses this key to lock in the EXACT same permanent URL on every reconnect)
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${YELLOW}🔑 Generating persistent SSH key for static tunnl.gg subdomain...${NC}"
    mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
    ssh-keygen -t ed25519 -N "" -f "$SSH_KEY" -C "gamesv7-stable-tunnl" > /dev/null 2>&1
    echo -e "${GREEN}✓ Persistent key created at $SSH_KEY${NC}\n"
else
    echo -e "${GREEN}✓ Persistent SSH identity loaded (${SSH_KEY})${NC}"
fi

# 2. Check Local Backend Server
echo -e "${CYAN}🔍 Checking local Games V7 server on port ${PORT}...${NC}"
if ! curl -s -m 2 "http://127.0.0.1:${PORT}/" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Games V7 server is not running on port ${PORT}.${NC}"
    
    # Try starting from parent or local server.js
    if [ -f "$DIR/../dead bokitware/server.js" ]; then
        echo -e "${CYAN}▶ Starting server via 'dead bokitware/server.js'...${NC}"
        (cd "$DIR/../dead bokitware" && node server.js > /tmp/gamesv7_server.log 2>&1) &
        sleep 2
    elif [ -f "$DIR/server.js" ]; then
        echo -e "${CYAN}▶ Starting local server.js...${NC}"
        (cd "$DIR" && node server.js > /tmp/gamesv7_server.log 2>&1) &
        sleep 2
    fi

    if curl -s -m 2 "http://127.0.0.1:${PORT}/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Local server started successfully on port ${PORT}!${NC}\n"
    else
        echo -e "${RED}❌ Could not automatically connect to port ${PORT}.${NC}"
        echo -e "${YELLOW}   Make sure your server is running ('node server.js' or './run.sh') and re-run this script.${NC}\n"
    fi
else
    echo -e "${GREEN}✓ Local server is actively responding on http://127.0.0.1:${PORT}${NC}\n"
fi

# Cleanup on Ctrl+C / Exit
CLEANED_UP=0
cleanup() {
    if [ "$CLEANED_UP" -eq 1 ]; then return; fi
    CLEANED_UP=1
    echo -e "\n${YELLOW}🛑 Shutting down tunnl.gg connection & background keep-alive...${NC}"
    if [ -n "$KEEP_ALIVE_PID" ]; then
        kill "$KEEP_ALIVE_PID" 2>/dev/null || true
    fi
    if [ -n "$SSH_PID" ]; then
        kill "$SSH_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Anti-Idle Heartbeat Function
# (Tunnl.gg normally terminates free tunnels after 2 hours without traffic.
#  This background pinger sends a tiny ping every 5 minutes to keep it alive indefinitely.)
start_keep_alive() {
    local target_url="$1"
    (
        while true; do
            sleep 300 # 5 minutes
            if [ -n "$target_url" ]; then
                # Send lightweight HTTP request with skip-warning header
                curl -s -m 15 -H "tunnl-skip-browser-warning: 1" -A "GamesV7-KeepAlive/24-7" \
                     "${target_url}/wisp/ping" > /dev/null 2>&1 || \
                curl -s -m 15 -H "tunnl-skip-browser-warning: 1" -A "GamesV7-KeepAlive/24-7" \
                     "${target_url}/" > /dev/null 2>&1 || true
            fi
        done
    ) &
    KEEP_ALIVE_PID=$!
}

# 4. Infinite Auto-Reconnect Loop (Survives 24-hour resets and network drops)
RECONNECT_COUNT=0

while true; do
    echo -e "${CYAN}🌐 Establishing secure tunnel to proxy.tunnl.gg (Port ${PORT})...${NC}"
    
    # Launch SSH process in background with keep-alive options
    # Using stable@proxy.tunnl.gg ensures the exact same permanent subdomain is used every single session!
    TMP_LOG=$(mktemp)
    ssh -o LogLevel=ERROR \
        -o StrictHostKeyChecking=accept-new \
        -o ServerAliveInterval=15 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -R "80:localhost:${PORT}" \
        stable@proxy.tunnl.gg > "$TMP_LOG" 2>&1 &
    SSH_PID=$!

    # Wait for the URL to be printed by the tunnl.gg banner
    ASSIGNED_URL=""
    for i in {1..30}; do
        if grep -oE "https://[a-zA-Z0-9.-]+\.tunnl\.gg" "$TMP_LOG" > /dev/null 2>&1; then
            ASSIGNED_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.tunnl\.gg" "$TMP_LOG" | head -n 1)
            break
        fi
        sleep 0.2
    done

    if [ -n "$ASSIGNED_URL" ]; then
        echo -e "${GREEN}${BOLD}========================================================================${NC}"
        echo -e "${GREEN}${BOLD}  🚀 TUNNEL ONLINE & PERMANENTLY LOCKED TO YOUR SSH KEY${NC}"
        echo -e "${GREEN}${BOLD}========================================================================${NC}"
        echo -e "${BOLD}  Main Portal:      ${CYAN}${ASSIGNED_URL}/games-v7/${NC}"
        echo -e "${BOLD}  BokitCord Hub:    ${CYAN}${ASSIGNED_URL}/${NC}"
        echo -e "${BOLD}  Direct Proxy Tab: ${CYAN}${ASSIGNED_URL}/games-v7/#proxy${NC}"
        echo -e "${BOLD}  Retro Games Grid: ${CYAN}${ASSIGNED_URL}/games-v7/#games${NC}"
        echo -e "${PURPLE}  ------------------------------------------------------------------------${NC}"
        echo -e "  🛡️  ${BOLD}Anti-Idle Pinger:${NC} ${GREEN}ACTIVE (Sends heartbeat traffic every 5 min)${NC}"
        echo -e "  ⏱️  ${BOLD}2-Hour Idle Limit:${NC} ${GREEN}BYPASSED (Won't expire from inactivity)${NC}"
        echo -e "  🔄 ${BOLD}24h Auto-Reconnect:${NC} ${GREEN}ACTIVE (Locks exact same URL forever)${NC}"
        echo -e "${GREEN}${BOLD}========================================================================${NC}\n"

        # Start or update the keep-alive pinger
        if [ -n "$KEEP_ALIVE_PID" ]; then
            kill "$KEEP_ALIVE_PID" 2>/dev/null || true
        fi
        start_keep_alive "$ASSIGNED_URL"

        # Stream requests from SSH in real-time
        tail -n +1 -f "$TMP_LOG" &
        TAIL_PID=$!

        # Wait for the SSH process to exit (e.g. 24h limit reached or network drop)
        wait "$SSH_PID" 2>/dev/null || true
        kill "$TAIL_PID" 2>/dev/null || true
        rm -f "$TMP_LOG"
    else
        echo -e "${RED}⚠️  Connection failed or timed out. SSH log output:${NC}"
        cat "$TMP_LOG"
        rm -f "$TMP_LOG"
    fi

    RECONNECT_COUNT=$((RECONNECT_COUNT + 1))
    echo -e "\n${YELLOW}🔄 Tunnel disconnected. Auto-reconnecting in 3 seconds (Attempt #${RECONNECT_COUNT})...${NC}"
    sleep 3
done
