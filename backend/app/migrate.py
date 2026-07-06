from sqlalchemy import inspect

from app.auth import hash_password, verify_password
from app.demo_credentials import EXAMPLE_REG_FORMATTED, student_demo_password
from app.models import Role, User

LEGACY_STUDENT_EMAILS = {
    "alex.mwangi@st.uok.ac.rw": EXAMPLE_REG_FORMATTED,
}


def migrate_schema(engine):
    inspector = inspect(engine)
    if "notifications" in inspector.get_table_names():
        columns = {c["name"] for c in inspector.get_columns("notifications")}
        if "action_path" not in columns:
            with engine.begin() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE notifications ADD COLUMN action_path VARCHAR"))

    if "users" in inspector.get_table_names():
        columns = {c["name"] for c in inspector.get_columns("users")}
        if "registration_number" not in columns:
            with engine.begin() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE users ADD COLUMN registration_number VARCHAR"))

    if "topic_proposals" in inspector.get_table_names():
        columns = {c["name"] for c in inspector.get_columns("topic_proposals")}
        if "registration_number" not in columns:
            with engine.begin() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE topic_proposals ADD COLUMN registration_number VARCHAR"))
                conn.execute(text("UPDATE topic_proposals SET registration_number = 'UOK/PENDING/' || id WHERE registration_number IS NULL"))
        if "rejection_reason" not in columns:
            with engine.begin() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE topic_proposals ADD COLUMN rejection_reason TEXT"))
        if "department" not in columns:
            with engine.begin() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE topic_proposals ADD COLUMN department VARCHAR"))
                conn.execute(text("UPDATE topic_proposals SET department = 'IT' WHERE department IS NULL"))


def backfill_notification_paths(db):
    from app.models import Notification

    rules = [
        ("Upcoming Deadline", "/student/progress"),
        ("New Feedback Received", "/student/feedback"),
        ("Supervisor Assigned", "/student"),
        ("Unassigned Students", "/hod/students"),
        ("New Submission", "/supervisor/reviews"),
        ("Review Reminder", "/supervisor/reviews"),
        ("Feedback on", "/student/feedback"),
        ("New submission from", "/supervisor/reviews"),
        ("Pending Topic Proposals", "/hod/proposals"),
        ("Supervisor Request", "/hod/requests"),
    ]
    changed = False
    for n in db.query(Notification).filter(Notification.action_path.is_(None)).all():
        for prefix, path in rules:
            if n.title.startswith(prefix) or prefix in n.title:
                n.action_path = path
                changed = True
                break
    if changed:
        db.commit()


def sync_student_registrations(db):
    changed = False
    for email, reg in LEGACY_STUDENT_EMAILS.items():
        user = db.query(User).filter(User.email == email, User.role == Role.STUDENT).first()
        if not user:
            continue
        if user.registration_number != reg:
            user.registration_number = reg
            changed = True

    for user in db.query(User).filter(User.role == Role.STUDENT).all():
        if not user.registration_number:
            continue
        expected = student_demo_password(user.registration_number)
        if not verify_password(expected, user.password):
            user.password = hash_password(expected)
            changed = True

    if changed:
        db.commit()
