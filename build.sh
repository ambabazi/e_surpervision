#!/usr/bin/env bash
# Render build entrypoint when Root Directory is repo root (not "backend")
set -euo pipefail
cd "$(dirname "$0")/backend"
chmod +x build.sh
exec ./build.sh
