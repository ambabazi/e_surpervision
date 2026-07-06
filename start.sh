#!/usr/bin/env bash
# Render start command when Root Directory is repo root (not "backend")
set -euo pipefail
cd "$(dirname "$0")/backend"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8080}"
