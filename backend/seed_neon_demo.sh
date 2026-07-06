#!/usr/bin/env bash
# Load demo data into your deployed Neon database (same as local reseed).
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env.neon ]; then
  echo "Missing backend/.env.neon — add your Neon PGHOST, PGUSER, PGPASSWORD, PGDATABASE."
  exit 1
fi

source .venv/bin/activate 2>/dev/null || { python3 -m venv .venv && source .venv/bin/activate && pip install -q -r requirements.txt; }

set -a
# shellcheck disable=SC1091
source .env.neon
unset DATABASE_URL 2>/dev/null || true
set +a

echo "Target: Neon ($PGDATABASE on $PGHOST)"
python reseed_db.py
echo ""
echo "Demo data loaded. Sign in on your deployed site with:"
echo "  Student: 202305000078 / Stu@202305000078!"
echo "  Supervisor: jean.bosco@uok.ac.rw / Uok@Sup2026!"
echo "  IT HOD: hod.it@uok.ac.rw / Uok@Hod2026!"
