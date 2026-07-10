#!/usr/bin/env python3
"""Clear PostgreSQL demo data and load the full rich seed dataset."""

from sqlalchemy import inspect, text

from app.database import Base, SessionLocal, engine
from app.hod_sync import sync_department_structure
from app.migrate import backfill_notification_paths, migrate_schema, sync_student_registrations
from app.seed import seed_demo_data
from app.submission_files import ensure_all_submission_files


TABLES = (
    "feedback",
    "notifications",
    "submissions",
    "tasks",
    "supervisor_student_requests",
    "topic_proposals",
    "projects",
    "users",
)


def clear_demo_data() -> None:
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    if not existing:
        return
    with engine.begin() as conn:
        for table in TABLES:
            if table in existing:
                conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))


def main() -> int:
    migrate_schema(engine)
    Base.metadata.create_all(bind=engine)
    print("Clearing existing demo data…")
    clear_demo_data()
    db = SessionLocal()
    try:
        print("Seeding rich demo dataset…")
        seed_demo_data(db)
        sync_department_structure(db)
        backfill_notification_paths(db)
        sync_student_registrations(db)
        restored = ensure_all_submission_files(db, force=True)
        print(f"Wrote {restored} student submission document(s) to backend/uploads/.")
    finally:
        db.close()
    print("Done. Restart ./run.sh and sign in with README demo credentials.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
