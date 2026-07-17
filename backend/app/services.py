from datetime import date
from typing import Optional

from app.datetime_utils import utc_now

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from app.auth import decode_token
from app.database import get_db
from app.email_service import (
    notify_submission_received,
    notify_submission_reviewed,
    student_notification_email,
)
from app.models import (
    Feedback,
    Notification,
    NotificationType,
    Priority,
    Project,
    ProjectStatus,
    ProposalStatus,
    Role,
    Submission,
    SubmissionStatus,
    Task,
    TaskStatus,
    TopicProposal,
    User,
)
from app.submission_policy import (
    sort_submissions_by_priority,
    validate_submission_window,
)
from app.schemas import (
    FeedbackOut,
    HodDashboardOut,
    NotificationOut,
    PipelineRowOut,
    ProjectOut,
    StudentDashboardOut,
    SubmissionOut,
    SupervisorDashboardOut,
    SupervisorWorkloadOut,
    TaskBoardOut,
    TaskOut,
    UserOut,
)

security = HTTPBearer(auto_error=False)
DEFAULT_CAPACITY = 8


def supervisor_load(db: Session, supervisor_id: int) -> int:
    return db.query(Project).filter(Project.supervisor_id == supervisor_id).count()


def _student_in_department(db: Session, student: User, department: str) -> bool:
    project = db.query(Project).filter(Project.student_id == student.id).first()
    if not project or not project.supervisor_id:
        return student.department == department
    sup = db.query(User).filter(User.id == project.supervisor_id).first()
    return sup is not None and sup.department == department


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user or not user.active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or inactive")
    return user


def require_role(*roles: Role):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have permission to access this resource")
        return user

    return checker


def user_out(u: Optional[User]) -> Optional[UserOut]:
    if not u:
        return None
    return UserOut.model_validate(u)


def project_out(p: Optional[Project]) -> Optional[ProjectOut]:
    if not p:
        return None
    days = None
    if p.due_date:
        days = (p.due_date - date.today()).days
    return ProjectOut(
        id=p.id,
        title=p.title,
        description=p.description,
        current_phase=p.current_phase,
        status=p.status,
        progress=p.progress,
        start_date=p.start_date.isoformat() if p.start_date else None,
        due_date=p.due_date.isoformat() if p.due_date else None,
        days_remaining=days,
        student=user_out(p.student),
        supervisor=user_out(p.supervisor),
    )


def task_out(t: Optional[Task]) -> Optional[TaskOut]:
    if not t:
        return None
    return TaskOut(
        id=t.id,
        title=t.title,
        description=t.description,
        category=t.category,
        status=t.status,
        priority=t.priority,
        progress=t.progress,
        due_date=t.due_date.isoformat() if t.due_date else None,
        milestone=t.milestone,
        project_id=t.project_id,
    )


def submission_out(s: Optional[Submission]) -> Optional[SubmissionOut]:
    if not s:
        return None
    student = s.project.student if s.project else None
    return SubmissionOut(
        id=s.id,
        title=s.title,
        notes=s.notes,
        file_url=s.file_url,
        file_name=s.file_name,
        status=s.status,
        submitted_at=s.submitted_at,
        project_id=s.project_id,
        task_id=s.task_id,
        student=user_out(student),
    )


def feedback_out(f: Optional[Feedback]) -> Optional[FeedbackOut]:
    if not f:
        return None
    return FeedbackOut(
        id=f.id,
        title=f.title,
        content=f.content,
        created_at=f.created_at,
        project_id=f.project_id,
        author=user_out(f.author),
    )


def notification_out(n: Optional[Notification]) -> Optional[NotificationOut]:
    if not n:
        return None
    return NotificationOut(
        id=n.id,
        title=n.title,
        message=n.message,
        type=n.type,
        severity=n.severity,
        read=n.read,
        action_path=n.action_path,
        created_at=n.created_at,
    )


def require_project(db: Session, student: User) -> Project:
    project = (
        db.query(Project)
        .options(joinedload(Project.supervisor), joinedload(Project.student))
        .filter(Project.student_id == student.id)
        .first()
    )
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No capstone project found for this student")
    return project


def student_dashboard(db: Session, student: User) -> StudentDashboardOut:
    project = require_project(db, student)
    tasks = db.query(Task).filter(Task.project_id == project.id).order_by(Task.due_date.asc()).all()

    upcoming = [
        task_out(t)
        for t in tasks
        if t.status in (TaskStatus.UPCOMING, TaskStatus.IN_PROGRESS)
    ][:4]

    milestones = [t for t in tasks if t.milestone and t.status != TaskStatus.COMPLETED]
    next_ms = min(milestones, key=lambda t: t.due_date or date.max, default=None)

    feedback = (
        db.query(Feedback)
        .options(joinedload(Feedback.author))
        .filter(Feedback.project_id == project.id)
        .order_by(Feedback.created_at.desc())
        .limit(5)
        .all()
    )
    submissions = (
        db.query(Submission)
        .filter(Submission.project_id == project.id)
        .order_by(Submission.submitted_at.desc())
        .limit(5)
        .all()
    )
    unread = db.query(Notification).filter(Notification.user_id == student.id, Notification.read == False).count()

    return StudentDashboardOut(
        student=user_out(student),
        project=project_out(project),
        supervisor=user_out(project.supervisor),
        upcoming_tasks=[t for t in upcoming if t],
        recent_feedback=[feedback_out(f) for f in feedback if f],
        recent_submissions=[submission_out(s) for s in submissions if s],
        unread_notifications=unread,
        next_milestone=task_out(next_ms),
    )


def task_board(db: Session, student: User) -> TaskBoardOut:
    project = require_project(db, student)
    tasks = db.query(Task).filter(Task.project_id == project.id).order_by(Task.due_date.asc()).all()

    milestones = [t for t in tasks if t.milestone and t.status != TaskStatus.COMPLETED]
    next_ms = min(milestones, key=lambda t: t.due_date or date.max, default=None)
    days_to = None
    if next_ms and next_ms.due_date:
        days_to = (next_ms.due_date - date.today()).days

    counts = {s.name: sum(1 for t in tasks if t.status == s) for s in TaskStatus}

    return TaskBoardOut(
        project=project_out(project),
        overall_progress=project.progress,
        next_milestone=task_out(next_ms),
        days_to_milestone=days_to,
        tasks=[task_out(t) for t in tasks if t],
        status_counts=counts,
    )


def supervisor_dashboard(db: Session, supervisor: User) -> SupervisorDashboardOut:
    from app.proposal_services import pending_review_out

    projects = (
        db.query(Project)
        .options(joinedload(Project.student))
        .filter(Project.supervisor_id == supervisor.id)
        .all()
    )
    active = sum(1 for p in projects if p.status != ProjectStatus.COMPLETED)
    completed = sum(1 for p in projects if p.status == ProjectStatus.COMPLETED)

    pending = sort_submissions_by_priority(
        db.query(Submission)
        .join(Project)
        .options(joinedload(Submission.project).joinedload(Project.student))
        .filter(Project.supervisor_id == supervisor.id, Submission.status == SubmissionStatus.SUBMITTED)
        .all()
    )
    alerts = (
        db.query(Notification)
        .filter(Notification.user_id == supervisor.id)
        .order_by(Notification.created_at.desc())
        .limit(6)
        .all()
    )
    pipeline = [
        PipelineRowOut(
            project_id=p.id,
            student_name=p.student.full_name if p.student else "Unassigned",
            project_title=p.title,
            current_phase=p.current_phase,
            status=p.status.name,
            progress=p.progress,
        )
        for p in projects
    ]

    return SupervisorDashboardOut(
        supervisor=user_out(supervisor),
        total_students=len(projects),
        pending_reviews=len(pending),
        active_projects=active,
        completed_projects=completed,
        pending_thesis_reviews=[pending_review_out(s) for s in pending if s],
        critical_alerts=[notification_out(a) for a in alerts if a],
        research_pipeline=pipeline,
    )


def _approved_proposal_topic(proposal: TopicProposal) -> str | None:
    idx = proposal.selected_topic_index
    if idx not in (1, 2, 3):
        return None
    topics = {1: proposal.topic_1, 2: proposal.topic_2, 3: proposal.topic_3}
    title = (topics[idx] or "").strip()
    return title or None


def _approved_topics_by_student(db: Session, department: str) -> dict[int, str]:
    """Map student id -> approved topic title for the department."""
    topics: dict[int, str] = {}
    approved = (
        db.query(TopicProposal)
        .filter(
            TopicProposal.department == department,
            TopicProposal.status == ProposalStatus.APPROVED,
        )
        .all()
    )
    for proposal in approved:
        topic = _approved_proposal_topic(proposal)
        if not topic:
            continue
        student = None
        if proposal.student_user_id:
            student = db.query(User).filter(User.id == proposal.student_user_id).first()
        if not student and proposal.registration_number:
            student = (
                db.query(User)
                .filter(
                    User.role == Role.STUDENT,
                    User.registration_number == proposal.registration_number,
                )
                .first()
            )
        if student:
            topics[student.id] = topic
    return topics


def hod_students_list(db: Session, hod: User) -> list:
    from app.schemas import HodStudentRowOut

    dept = hod.department
    students = db.query(User).filter(User.role == Role.STUDENT).order_by(User.full_name.asc()).all()
    if dept:
        students = [s for s in students if s.department == dept or _student_in_department(db, s, dept)]

    approved_topics = _approved_topics_by_student(db, dept) if dept else {}

    rows = []
    for st in students:
        project = (
            db.query(Project)
            .options(joinedload(Project.supervisor))
            .filter(Project.student_id == st.id)
            .first()
        )
        assigned = project is not None and project.supervisor_id is not None
        approved_topic = approved_topics.get(st.id) or (project.title if project else None)
        rows.append(
            HodStudentRowOut(
                id=st.id,
                full_name=st.full_name,
                email=st.email,
                registration_number=st.registration_number,
                program=st.program,
                department=st.department,
                phone=st.phone,
                is_assigned=assigned,
                approved_topic=approved_topic,
                project_title=project.title if project else None,
                project_status=project.status if project else None,
                supervisor=user_out(project.supervisor) if project and project.supervisor else None,
            )
        )
    return rows


def hod_dashboard(db: Session, hod: User) -> HodDashboardOut:
    from app.models import ProposalStatus, RequestStatus, TopicProposal, SupervisorStudentRequest

    dept = hod.department
    students = db.query(User).filter(User.role == Role.STUDENT).all()
    if dept:
        students = [s for s in students if s.department == dept or _student_in_department(db, s, dept)]
    supervisors = db.query(User).filter(User.role == Role.SUPERVISOR)
    if dept:
        supervisors = supervisors.filter(User.department == dept)
    supervisors = supervisors.all()

    projects_q = db.query(Project).options(joinedload(Project.student), joinedload(Project.supervisor))
    if dept:
        projects_q = projects_q.join(User, Project.supervisor_id == User.id).filter(User.department == dept)
    projects = projects_q.all()

    active = sum(1 for p in projects if p.status != ProjectStatus.COMPLETED)
    faculty_perf = round(sum(p.progress for p in projects) / len(projects), 1) if projects else 0.0

    workload = []
    for s in supervisors:
        load = db.query(Project).filter(Project.supervisor_id == s.id).count()
        status = "AT_CAPACITY" if load >= DEFAULT_CAPACITY else ("HIGH" if load >= DEFAULT_CAPACITY - 2 else "AVAILABLE")
        workload.append(
            SupervisorWorkloadOut(
                supervisor_id=s.id,
                name=s.full_name,
                title=s.title,
                load=load,
                capacity=DEFAULT_CAPACITY,
                status=status,
            )
        )

    unassigned = []
    for st in students:
        proj = db.query(Project).filter(Project.student_id == st.id).first()
        if proj is None or proj.supervisor_id is None:
            unassigned.append(user_out(st))

    breakdown = {}
    for ps in ProjectStatus:
        count = sum(1 for p in projects if p.status == ps)
        if count > 0:
            breakdown[ps.name] = count

    pending_proposals = db.query(TopicProposal).filter(TopicProposal.status == ProposalStatus.PENDING)
    if dept:
        pending_proposals = pending_proposals.filter(TopicProposal.department == dept)
    pending_proposals_count = pending_proposals.count()

    pending_requests_q = db.query(SupervisorStudentRequest).filter(
        SupervisorStudentRequest.status == RequestStatus.PENDING
    )
    if dept:
        pending_requests_q = pending_requests_q.join(User, SupervisorStudentRequest.supervisor_id == User.id).filter(
            User.department == dept
        )
    pending_requests = pending_requests_q.count()

    return HodDashboardOut(
        faculty_performance=faculty_perf,
        total_students=len(students),
        total_supervisors=len(supervisors),
        active_projects=active,
        unassigned_count=len(unassigned),
        pending_proposals=pending_proposals_count,
        pending_supervisor_requests=pending_requests,
        supervisor_workload=workload,
        unassigned_students=[u for u in unassigned if u],
        project_status_breakdown=breakdown,
    )


def create_submission(db: Session, student: User, *, title: str, notes: str | None, file_url: str | None, file_name: str | None, task_id: int | None) -> SubmissionOut:
    validate_submission_window()

    if not file_name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A PDF document is required.")
    if not file_url:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A document upload is required.")

    ext = file_name[file_name.rfind(".") :].lower() if "." in file_name else ""
    if ext != ".pdf":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Only PDF documents (.pdf) are allowed.",
        )

    project = require_project(db, student)
    task = None
    if task_id:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    submission = Submission(
        title=title,
        notes=notes,
        file_url=file_url,
        file_name=file_name,
        status=SubmissionStatus.SUBMITTED,
        project_id=project.id,
        task_id=task.id if task else None,
        submitted_at=utc_now(),
    )
    db.add(submission)
    db.flush()

    if project.supervisor_id:
        db.add(
            Notification(
                title=f"New submission from {student.full_name}",
                message=title,
                type=NotificationType.ASSIGNMENT,
                severity=Priority.MEDIUM,
                user_id=project.supervisor_id,
                action_path="/supervisor/reviews",
            )
        )
    db.commit()
    db.refresh(submission)

    student_email = student_notification_email(student.email)
    if student_email:
        try:
            notify_submission_received(
                to=student_email,
                full_name=student.full_name,
                submission_title=title,
                project_title=project.title,
            )
        except Exception:
            pass

    return submission_out(submission)


def review_submission(db: Session, supervisor: User, submission_id: int, *, status: str, feedback: str | None) -> SubmissionOut:
    submission = (
        db.query(Submission)
        .options(joinedload(Submission.project).joinedload(Project.student))
        .filter(Submission.id == submission_id)
        .first()
    )
    if not submission:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Submission not found")
    if not submission.project or submission.project.supervisor_id != supervisor.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not the supervisor for this submission")

    try:
        submission.status = SubmissionStatus(status)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid submission status: {status}")

    if feedback and feedback.strip():
        db.add(
            Feedback(
                title=f"Review: {submission.title}",
                content=feedback,
                project_id=submission.project_id,
                author_id=supervisor.id,
                submission_id=submission.id,
            )
        )

    student = submission.project.student
    if student:
        db.add(
            Notification(
                title=f"Feedback on {submission.title}",
                message=f"Your supervisor reviewed your submission: {submission.status.name.replace('_', ' ')}",
                type=NotificationType.FEEDBACK,
                severity=Priority.MEDIUM,
                user_id=student.id,
                action_path="/student/feedback",
            )
        )

    db.commit()
    db.refresh(submission)

    if student:
        student_email = student_notification_email(student.email)
        if student_email:
            try:
                notify_submission_reviewed(
                    to=student_email,
                    full_name=student.full_name,
                    submission_title=submission.title,
                    review_status=submission.status.value,
                    feedback=feedback,
                    supervisor_name=supervisor.full_name,
                    project_progress=submission.project.progress if submission.project else None,
                )
            except Exception:
                pass

    return submission_out(submission)


def supervisor_students_list(db: Session, supervisor: User):
    from app.schemas import SupervisorStudentOut

    projects = (
        db.query(Project)
        .options(joinedload(Project.student), joinedload(Project.supervisor))
        .filter(Project.supervisor_id == supervisor.id)
        .all()
    )
    results = []
    for p in projects:
        submissions = (
            db.query(Submission)
            .options(joinedload(Submission.project).joinedload(Project.student))
            .filter(Submission.project_id == p.id)
            .order_by(Submission.submitted_at.desc())
            .all()
        )
        tasks = db.query(Task).filter(Task.project_id == p.id).all()
        milestones = [t for t in tasks if t.milestone]
        last = submissions[0] if submissions else None
        pending = sum(1 for s in submissions if s.status == SubmissionStatus.SUBMITTED)
        results.append(
            SupervisorStudentOut(
                project=project_out(p),
                pending_submissions=pending,
                total_submissions=len(submissions),
                last_submission_title=last.title if last else None,
                last_submission_at=last.submitted_at if last else None,
                completed_milestones=sum(1 for t in milestones if t.status == TaskStatus.COMPLETED),
                total_milestones=len(milestones),
                submissions=[submission_out(s) for s in submissions if s],
            )
        )
    return results


def hod_supervisor_projects(db: Session, supervisor_id: int) -> list:
    supervisor = db.query(User).filter(User.id == supervisor_id, User.role == Role.SUPERVISOR).first()
    if not supervisor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Supervisor not found")

    projects = (
        db.query(Project)
        .options(joinedload(Project.student), joinedload(Project.supervisor))
        .filter(Project.supervisor_id == supervisor_id)
        .order_by(Project.progress.desc())
        .all()
    )
    return [project_out(p) for p in projects if p]


def hod_faculty_overview(db: Session, hod: User):
    from app.schemas import HodFacultyOverviewOut, SupervisorFacultyStatOut

    dept = hod.department
    supervisors_q = db.query(User).filter(User.role == Role.SUPERVISOR)
    if dept:
        supervisors_q = supervisors_q.filter(User.department == dept)
    supervisors = supervisors_q.all()

    projects_q = db.query(Project).options(joinedload(Project.student), joinedload(Project.supervisor))
    if dept:
        projects_q = projects_q.join(User, Project.supervisor_id == User.id).filter(User.department == dept)
    projects = projects_q.all()

    on_track = sum(1 for p in projects if p.status in (ProjectStatus.IN_PROGRESS, ProjectStatus.UNDER_REVIEW))
    at_risk = sum(1 for p in projects if p.status in (ProjectStatus.REVISION, ProjectStatus.ON_HOLD))
    completed = sum(1 for p in projects if p.status == ProjectStatus.COMPLETED)
    faculty_perf = round(sum(p.progress for p in projects) / len(projects), 1) if projects else 0.0

    supervisor_stats = []
    for s in supervisors:
        s_projects = [p for p in projects if p.supervisor_id == s.id]
        if dept and not s_projects:
            continue
        avg = round(sum(p.progress for p in s_projects) / len(s_projects), 1) if s_projects else 0.0
        supervisor_stats.append(
            SupervisorFacultyStatOut(
                supervisor_id=s.id,
                name=s.full_name,
                title=s.title,
                student_count=len(s_projects),
                avg_progress=avg,
                completed_projects=sum(1 for p in s_projects if p.status == ProjectStatus.COMPLETED),
                at_risk_count=sum(1 for p in s_projects if p.status in (ProjectStatus.REVISION, ProjectStatus.ON_HOLD)),
            )
        )

    program_totals: dict[str, list[int]] = {}
    for p in projects:
        if p.student and p.student.program:
            program_totals.setdefault(p.student.program, []).append(p.progress)
    progress_by_program = {
        prog: round(sum(vals) / len(vals), 1) for prog, vals in program_totals.items()
    }

    return HodFacultyOverviewOut(
        faculty_performance=faculty_perf,
        on_track_count=on_track,
        at_risk_count=at_risk,
        completed_count=completed,
        total_projects=len(projects),
        supervisor_stats=supervisor_stats,
        progress_by_program=progress_by_program,
    )
