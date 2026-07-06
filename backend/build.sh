#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Python: $(python --version)"
case "$(python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')" in
  3.12|3.11|3.13) ;;
  *)
    echo "ERROR: Render must use Python 3.12 (not 3.14)."
    echo "Fix: Render Dashboard → Settings → set Root Directory to 'backend',"
    echo "     add env var PYTHON_VERSION=3.12.8, then Clear build cache & deploy."
    exit 1
    ;;
esac

pip install --upgrade pip
pip install -r requirements.txt
