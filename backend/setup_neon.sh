#!/usr/bin/env bash
# Initialize Neon PostgreSQL (DEPLOYMENT.md Step 1)
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env.neon ]; then
  echo "Create backend/.env.neon from your Neon dashboard connection string."
  echo "See DEPLOYMENT.md Step 1."
  exit 1
fi

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

set -a
# shellcheck disable=SC1091
source .env.neon
# Override local .env postgres settings
unset DATABASE_URL 2>/dev/null || true
set +a

echo "Testing Neon connection…"
python check_db.py

echo "Creating tables and seeding demo data…"
python reseed_db.py

echo ""
echo "Step 1 complete. Neon database is ready."
echo "Next: deploy backend on Render with the same PG* variables from .env.neon"
