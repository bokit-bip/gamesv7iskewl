#!/usr/bin/env bash
set -e

REPO_DIR="/home/bokit/Documents/GitHub/gamesv7iskewl"
cd "$REPO_DIR"

echo "=========================================================="
echo "   Pushing Games V7 to GitHub & Purging jsDelivr Cache    "
echo "=========================================================="

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
  git add -A
  git commit -m "feat(update): sync latest VIP code redemption and arcade updates"
fi

echo "Pushing commits to origin main..."
git push origin main

echo ""
echo "Purging jsDelivr CDN cache so the link updates instantly..."
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/index.svg" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/site.svg" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/index.html" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/app.js" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/style.css" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/style-v8.css" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/assets/movies_data.js" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/assets/music_data.js" > /dev/null || true
curl -s "https://purge.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/assets/recommended_music.json" > /dev/null || true

echo "✅ Done! Your link is updated:"
echo "https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/index.svg"
echo "=========================================================="
