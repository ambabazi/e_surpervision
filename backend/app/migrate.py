from sqlalchemy import inspect
from pathlib import Path

from app.auth import hash_password, verify_password
from app.demo_credentials import STAFF_DEFAULT_PASSWORD, format_registration_number, student_password
from app.files import UPLOAD_DIR
from app.models import Project, Role, User


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
    for user in db.query(User).filter(User.role == Role.STUDENT).all():
        if not user.registration_number:
            continue
        try:
            normalized = format_registration_number(user.registration_number)
            if user.registration_number != normalized:
                user.registration_number = normalized
                changed = True
        except ValueError:
            continue
        expected = student_password(user.registration_number)
        if not verify_password(expected, user.password):
            user.password = hash_password(expected)
            changed = True

    for user in db.query(User).filter(User.role.in_([Role.SUPERVISOR, Role.HOD])).all():
        if not verify_password(STAFF_DEFAULT_PASSWORD, user.password):
            user.password = hash_password(STAFF_DEFAULT_PASSWORD)
            changed = True

    if changed:
        db.commit()


def repair_demo_data(db) -> None:
    """Fix legacy names, remove file-less submissions, and restore missing upload files."""
    from sqlalchemy.orm import joinedload

    from app.models import Feedback, Submission
    from app.submission_files import ensure_all_submission_files, is_demo_submission_filename, write_demo_submission_file

    changed = False

    for user in db.query(User).all():
        if user.full_name == "Aggie Moraa":
            user.full_name = "Faith Uwase"
            if user.email == "aggie.moraa.capstone@gmail.com":
                user.email = "faith.uwase.capstone@gmail.com"
            changed = True
        if user.full_name == "Dr. Morris Moraa":
            user.full_name = "Dr. Morris Kagabo"
            changed = True

    orphan_submissions = (
        db.query(Submission)
        .filter((Submission.file_url.is_(None)) | (Submission.file_name.is_(None)))
        .all()
    )
    for submission in orphan_submissions:
        db.query(Feedback).filter(Feedback.submission_id == submission.id).update(
            {"submission_id": None},
            synchronize_session=False,
        )
        db.delete(submission)
        changed = True

    if changed:
        db.commit()

    submissions = (
        db.query(Submission)
        .options(joinedload(Submission.project).joinedload(Project.student))
        .filter(Submission.file_url.isnot(None))
        .all()
    )
    for submission in submissions:
        filename = submission.file_url.split("/")[-1]
        if not is_demo_submission_filename(filename):
            continue
        path = UPLOAD_DIR / filename
        if path.exists():
            continue
        student_name = submission.project.student.full_name if submission.project and submission.project.student else "Student"
        project_title = submission.project.title if submission.project else "Capstone Project"
        write_demo_submission_file(
            filename,
            title=submission.title,
            student_name=student_name,
            project_title=project_title,
            notes=submission.notes or "Submitted via the E-Supervision Portal.",
            force=False,
        )
