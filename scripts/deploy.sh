#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_DIR"

echo "[1/3] Pull latest from origin/main"
git pull origin main

echo "[2/3] Build and restart services"
docker compose up -d --build

echo "[3/3] Health check"
curl -f http://localhost:8080/actuator/health >/dev/null

echo "Deploy completed successfully"
