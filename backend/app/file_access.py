from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Project, Role, Submission, User


def submission_for_filename(db: Session, filename: str) -> Submission | None:
    safe = Path(filename).name
    return (
        db.query(Submission)
        .options(joinedload(Submission.project).joinedload(Project.student), joinedload(Submission.project).joinedload(Project.supervisor))
        .filter(Submission.file_url.isnot(None))
        .filter(Submission.file_url.like(f"%/{safe}"))
        .first()
    )


def user_can_access_submission_file(db: Session, user: User, filename: str) -> bool:
    submission = submission_for_filename(db, filename)
    if not submission or not submission.project:
        return False

    project = submission.project
    if user.role == Role.STUDENT and project.student_id == user.id:
        return True
    if user.role == Role.SUPERVISOR and project.supervisor_id == user.id:
        return True
    if user.role == Role.HOD:
        student = project.student
        supervisor = project.supervisor
        if student and student.department == user.department:
            return True
        if supervisor and supervisor.department == user.department:
            return True
    return False


def assert_file_access(db: Session, user: User, filename: str) -> None:
    if not user_can_access_submission_file(db, user, filename):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have permission to open this document")
