#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
PORT="${PORT:-8080}"
if ss -tln 2>/dev/null | grep -q ":${PORT} "; then
  echo "Port ${PORT} is already in use. Stop the other backend first:"
  echo "  fuser -k ${PORT}/tcp"
  echo "Or use a different port: PORT=8081 ./run.sh"
  exit 1
fi
exec uvicorn app.main:app --reload --host 0.0.0.0 --port "${PORT}"
