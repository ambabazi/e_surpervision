#!/usr/bin/env python3
"""Verify PostgreSQL connection and list tables in e_supervision."""

from sqlalchemy import inspect, text

from app.config import settings
from app.database import engine


def main() -> int:
    url = settings.resolved_database_url()
    print(f"Database target: {_describe_target()}")

    if url.startswith("sqlite"):
        print("\nWARNING: Using SQLite. For production and pgAdmin, set PostgreSQL in backend/.env:")
        print("  PGUSER=postgres")
        print("  PGPASSWORD=your_password")
        print("  PGDATABASE=e_supervision")
        return 1

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_name = conn.execute(text("SELECT current_database()")).scalar()
            print(f"\nConnected to database: {db_name}")
    except Exception as exc:
        print("\nConnection FAILED.")
        print("Use PGUSER / PGPASSWORD / PGDATABASE in backend/.env (safe for passwords with @):")
        print("  PGHOST=localhost")
        print("  PGPORT=5432")
        print("  PGUSER=postgres")
        print("  PGPASSWORD=your_pgadmin_password")
        print("  PGDATABASE=e_supervision")
        err = str(exc)
        if "12@localhost" in err or "could not translate host name" in err:
            print("\nHint: Your password likely contains '@'. Do NOT use DATABASE_URL with a raw @ in the password.")
            print("      Use the PG* variables above, or encode @ as %40 in DATABASE_URL.")
        print(f"\nError: {exc}")
        return 1

    inspector = inspect(engine)
    tables = sorted(inspector.get_table_names())
    if tables:
        print(f"\nTables ({len(tables)}): {', '.join(tables)}")
    else:
        print("\nNo tables yet. Start the backend once — it creates tables and seeds demo data.")
    return 0


def _describe_target() -> str:
    if settings.pguser and settings.pgdatabase:
        host = settings.pghost or "localhost"
        return f"postgresql://{settings.pguser}:****@{host}:{settings.pgport}/{settings.pgdatabase}"
    return _redact(settings.database_url)


def _redact(url: str) -> str:
    if "://" not in url or "@" not in url:
        return url
    prefix, rest = url.split("://", 1)
    creds, host = rest.rsplit("@", 1)
    user = creds.split(":", 1)[0]
    return f"{prefix}://{user}:****@{host}"


if __name__ == "__main__":
    raise SystemExit(main())
