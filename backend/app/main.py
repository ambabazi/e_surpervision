from datetime import datetime, timezone

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.auth_login import login_user
from app.config import settings
from app.database import Base, engine, get_db
from app.files import UPLOAD_DIR, ensure_upload_dir, save_upload
from app.file_access import assert_file_access, submission_for_filename
from app.submission_files import (
    ensure_all_submission_files,
    filename_from_file_url,
    is_demo_submission_filename,
    is_real_upload_file,
    MIN_REAL_UPLOAD_BYTES,
    regenerate_submission_file,
)
from app.models import Notification, Project, Role, Submission, User
from app.models import ProposalStatus
from app.schemas import (
    ApproveProposalRequest,
    AssignStudentSupervisorRequest,
    UpdateHodStudentRequest,
    AuthResponse,
    CreateStudentRequest,
    FeedbackOut,
    HealthOut,
    HodStudentRowOut,
    HodDashboardOut,
    HodFacultyOverviewOut,
    HodProposalPipelineOut,
    HodStudentRequestOut,
    LoginRequest,
    NotificationOut,
    ProjectOut,
    PublicSupervisorOut,
    RejectProposalRequest,
    RespondStudentRequestBody,
    ReviewSubmissionRequest,
    StudentDashboardOut,
    SubmissionOut,
    SupervisorDashboardOut,
    SupervisorStudentOut,
    SupervisorStudentRequestCreate,
    SupervisorStudentRequestOut,
    TaskBoardOut,
    TopicProposalCreateRequest,
    TopicProposalOut,
    UnreadCountOut,
    UserOut,
)
from app.proposal_services import (
    approve_proposal,
    create_supervisor_request,
    create_topic_proposal,
    hod_assign_student_supervisor,
    hod_create_student,
    hod_update_student,
    hod_proposal_pipeline,
    list_hod_student_requests,
    list_public_supervisors,
    list_supervisor_requests,
    list_topic_proposals,
    reject_proposal,
    respond_hod_student_request,
)
from app.hod_sync import sync_department_structure
from app.departments import DEPARTMENT_LABELS, PROGRAMS_BY_DEPARTMENT, Department
from app.migrate import backfill_notification_paths, migrate_schema, repair_demo_data, sync_student_registrations
from app.reference_topics import ensure_reference_topics
from app.seed import seed_demo_data, seed_sample_proposals
from app.submission_files import ensure_all_submission_files
from app.submission_policy import sort_submissions_by_priority
from app.services import (
    create_submission,
    feedback_out,
    get_current_user,
    hod_dashboard,
    hod_faculty_overview,
    hod_students_list,
    hod_supervisor_projects,
    notification_out,
    require_role,
    review_submission,
    student_dashboard,
    submission_out,
    supervisor_dashboard,
    supervisor_students_list,
    task_board,
    update_submission,
    user_out,
)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def migrate_schema_db():
    migrate_schema(engine)


def verify_database_connection() -> None:
    if settings.resolved_database_url().startswith("sqlite"):
        return
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise RuntimeError(
            "Cannot connect to PostgreSQL. Edit backend/.env with your pgAdmin credentials, e.g.\n"
            "  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/e_supervision\n"
            f"Original error: {exc}"
        ) from exc


@app.on_event("startup")
def startup():
    verify_database_connection()
    Base.metadata.create_all(bind=engine)
    migrate_schema_db()
    ensure_upload_dir()
    db = next(get_db())
    try:
        seed_demo_data(db)
        seed_sample_proposals(db)
        ensure_reference_topics(db)
        sync_department_structure(db)
        backfill_notification_paths(db)
        sync_student_registrations(db)
        repair_demo_data(db)
        restored = ensure_all_submission_files(db)
        if restored:
            print(f"Ensured {restored} student submission file(s) on disk.")
    finally:
        db.close()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        first = errors[0]
        field = first.get("loc", [])[-1] if first.get("loc") else None
        msg = first.get("msg", "Invalid request data")
        message = f"{field}: {msg}" if field and field != "body" else msg
    else:
        message = "Invalid request data"
    return JSONResponse(
        status_code=422,
        content={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": 422,
            "error": "Validation Error",
            "message": message,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": exc.status_code,
            "error": "Unauthorized" if exc.status_code == 401 else "Forbidden" if exc.status_code == 403 else "Error",
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
        },
    )


@app.get("/api/health", response_model=HealthOut)
def health():
    return HealthOut(status="UP", service=settings.app_name)


@app.get("/api/files/{filename}")
def download_file(filename: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    safe_name = filename.split("/")[-1]
    assert_file_access(db, user, safe_name)
    path = UPLOAD_DIR / safe_name
    if not path.exists() or not path.is_file():
        if is_demo_submission_filename(safe_name):
            path = regenerate_submission_file(db, safe_name)
        if not path or not path.exists():
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "The uploaded file is no longer on the server. Ask the student to submit it again.",
            )
    elif is_real_upload_file(path) and path.stat().st_size < MIN_REAL_UPLOAD_BYTES:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "The uploaded file was lost on the server. Ask the student to submit it again.",
        )
    submission = submission_for_filename(db, safe_name)
    media_type = "application/octet-stream"
    if safe_name.lower().endswith(".pdf"):
        media_type = "application/pdf"
    elif safe_name.lower().endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif safe_name.lower().endswith(".doc"):
        media_type = "application/msword"
    download_name = submission.file_name if submission and submission.file_name else safe_name
    return FileResponse(path, media_type=media_type, filename=download_name)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, identifier=body.email, password=body.password, portal=body.portal)


@app.get("/api/public/programs")
def public_programs():
    return {
        "departments": [
            {
                "code": dept.value,
                "label": DEPARTMENT_LABELS[dept],
                "programs": PROGRAMS_BY_DEPARTMENT[dept],
            }
            for dept in Department
        ]
    }


@app.get("/api/public/supervisors", response_model=list[PublicSupervisorOut])
def public_supervisors(department: str, db: Session = Depends(get_db)):
    return list_public_supervisors(db, department=department)


@app.get("/api/public/submission-window")
def public_submission_window():
    if not settings.submission_window_enabled:
        return {
            "enabled": False,
            "timezone": settings.submission_timezone,
            "startHour": settings.submission_window_start_hour,
            "endHour": settings.submission_window_end_hour,
            "message": "Submissions are accepted at any time.",
        }
    return {
        "enabled": settings.submission_window_enabled,
        "timezone": settings.submission_timezone,
        "startHour": settings.submission_window_start_hour,
        "endHour": settings.submission_window_end_hour,
        "message": (
            f"Submit between {settings.submission_window_start_hour:02d}:00 and "
            f"{settings.submission_window_end_hour:02d}:00 ({settings.submission_timezone}). "
            "Morning submissions appear first on your supervisor's review queue."
        ),
    }


@app.post("/api/public/topic-proposals", response_model=TopicProposalOut, status_code=201)
def public_topic_proposal(body: TopicProposalCreateRequest, db: Session = Depends(get_db)):
    return create_topic_proposal(db, body)


@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user_out(user)


@app.get("/api/student/dashboard", response_model=StudentDashboardOut)
def student_dash(user: User = Depends(require_role(Role.STUDENT)), db: Session = Depends(get_db)):
    return student_dashboard(db, user)


@app.get("/api/student/tasks", response_model=TaskBoardOut)
def student_tasks(user: User = Depends(require_role(Role.STUDENT)), db: Session = Depends(get_db)):
    return task_board(db, user)


@app.get("/api/student/submissions", response_model=list[SubmissionOut])
def student_submissions(user: User = Depends(require_role(Role.STUDENT)), db: Session = Depends(get_db)):
    from app.services import require_project

    project = require_project(db, user)
    rows = (
        db.query(Submission)
        .filter(Submission.project_id == project.id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return [submission_out(s) for s in rows if s]


@app.get("/api/student/feedback", response_model=list[FeedbackOut])
def student_feedback(user: User = Depends(require_role(Role.STUDENT)), db: Session = Depends(get_db)):
    from app.models import Feedback
    from app.services import require_project

    project = require_project(db, user)
    rows = (
        db.query(Feedback)
        .options(joinedload(Feedback.author))
        .filter(Feedback.project_id == project.id)
        .order_by(Feedback.created_at.desc())
        .all()
    )
    return [feedback_out(f) for f in rows if f]


@app.post("/api/student/submissions", response_model=SubmissionOut)
async def student_submit(
    title: str = Form(...),
    notes: str = Form(""),
    file: UploadFile = File(...),
    user: User = Depends(require_role(Role.STUDENT)),
    db: Session = Depends(get_db),
):
    stored_name, file_url = await save_upload(file)
    return create_submission(
        db,
        user,
        title=title.strip(),
        notes=notes.strip() or None,
        file_url=file_url,
        file_name=file.filename,
        task_id=None,
    )


@app.patch("/api/student/submissions/{submission_id}", response_model=SubmissionOut)
async def student_update_submission(
    submission_id: int,
    notes: str = Form(""),
    file: UploadFile = File(...),
    user: User = Depends(require_role(Role.STUDENT)),
    db: Session = Depends(get_db),
):
    stored_name, file_url = await save_upload(file)
    return update_submission(
        db,
        user,
        submission_id,
        notes=notes.strip() or None,
        file_url=file_url,
        file_name=file.filename,
    )


@app.get("/api/supervisor/dashboard", response_model=SupervisorDashboardOut)
def supervisor_dash(user: User = Depends(require_role(Role.SUPERVISOR)), db: Session = Depends(get_db)):
    return supervisor_dashboard(db, user)


@app.get("/api/supervisor/students", response_model=list[SupervisorStudentOut])
def supervisor_students(user: User = Depends(require_role(Role.SUPERVISOR)), db: Session = Depends(get_db)):
    return supervisor_students_list(db, user)


@app.get("/api/supervisor/reviews", response_model=list[SubmissionOut])
def supervisor_reviews(user: User = Depends(require_role(Role.SUPERVISOR)), db: Session = Depends(get_db)):
    rows = sort_submissions_by_priority(
        db.query(Submission)
        .join(Project)
        .options(joinedload(Submission.project).joinedload(Project.student))
        .filter(Project.supervisor_id == user.id)
        .all()
    )
    real_uploads = [
        s
        for s in rows
        if s.file_url
        and not is_demo_submission_filename(filename_from_file_url(s.file_url) or "")
    ]
    return [submission_out(s) for s in real_uploads if s]


@app.post("/api/supervisor/submissions/{submission_id}/review", response_model=SubmissionOut)
def supervisor_review(
    submission_id: int,
    body: ReviewSubmissionRequest,
    user: User = Depends(require_role(Role.SUPERVISOR)),
    db: Session = Depends(get_db),
):
    return review_submission(db, user, submission_id, status=body.status, feedback=body.feedback)


@app.post("/api/supervisor/student-requests", response_model=SupervisorStudentRequestOut, status_code=201)
def supervisor_request_student(
    body: SupervisorStudentRequestCreate,
    user: User = Depends(require_role(Role.SUPERVISOR)),
    db: Session = Depends(get_db),
):
    return create_supervisor_request(db, user, body.message)


@app.get("/api/supervisor/student-requests", response_model=list[SupervisorStudentRequestOut])
def supervisor_list_requests(
    user: User = Depends(require_role(Role.SUPERVISOR)),
    db: Session = Depends(get_db),
):
    return list_supervisor_requests(db, user)


@app.get("/api/hod/dashboard", response_model=HodDashboardOut)
def hod_dash(user: User = Depends(require_role(Role.HOD)), db: Session = Depends(get_db)):
    return hod_dashboard(db, user)


@app.get("/api/hod/faculty-overview", response_model=HodFacultyOverviewOut)
def hod_faculty(user: User = Depends(require_role(Role.HOD)), db: Session = Depends(get_db)):
    return hod_faculty_overview(db, user)


@app.get("/api/hod/supervisors/{supervisor_id}/students", response_model=list[ProjectOut])
def hod_supervisor_students(
    supervisor_id: int,
    _: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    return hod_supervisor_projects(db, supervisor_id)


@app.get("/api/hod/proposal-pipeline", response_model=HodProposalPipelineOut)
def hod_proposal_pipeline_view(
    status: str | None = None,
    user: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    filt = ProposalStatus(status) if status else None
    return hod_proposal_pipeline(db, user, status_filter=filt)


@app.get("/api/hod/topic-proposals", response_model=list[TopicProposalOut])
def hod_topic_proposals(
    status: str | None = None,
    _: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    filt = ProposalStatus(status) if status else None
    return list_topic_proposals(db, status_filter=filt)


@app.post("/api/hod/topic-proposals/{proposal_id}/approve", response_model=TopicProposalOut)
def hod_approve_proposal(
    proposal_id: int,
    body: ApproveProposalRequest,
    _: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    return approve_proposal(db, proposal_id, body)


@app.post("/api/hod/topic-proposals/{proposal_id}/reject", response_model=TopicProposalOut)
def hod_reject_proposal(
    proposal_id: int,
    body: RejectProposalRequest,
    _: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    return reject_proposal(db, proposal_id, body)


@app.get("/api/hod/students", response_model=list[HodStudentRowOut])
def hod_list_students(hod: User = Depends(require_role(Role.HOD)), db: Session = Depends(get_db)):
    return hod_students_list(db, hod)


@app.post("/api/hod/students", response_model=UserOut, status_code=201)
def hod_create_student_account(
    body: CreateStudentRequest,
    _: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    return hod_create_student(db, body)


@app.patch("/api/hod/students/{student_id}", response_model=UserOut)
def hod_update_student_account(
    student_id: int,
    body: UpdateHodStudentRequest,
    hod: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    return hod_update_student(db, hod, student_id, body)


@app.post("/api/hod/students/{student_id}/assign-supervisor", response_model=UserOut)
def hod_assign_supervisor(
    student_id: int,
    body: AssignStudentSupervisorRequest,
    hod: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    return hod_assign_student_supervisor(
        db,
        hod,
        student_id,
        supervisor_id=body.supervisor_id,
        project_title=body.project_title,
        project_description=body.project_description,
    )


@app.get("/api/hod/student-requests", response_model=list[HodStudentRequestOut])
def hod_student_requests(_: User = Depends(require_role(Role.HOD)), db: Session = Depends(get_db)):
    return list_hod_student_requests(db)


@app.post("/api/hod/student-requests/{request_id}/respond", response_model=HodStudentRequestOut)
def hod_respond_student_request(
    request_id: int,
    body: RespondStudentRequestBody,
    _: User = Depends(require_role(Role.HOD)),
    db: Session = Depends(get_db),
):
    return respond_hod_student_request(db, request_id, body)


@app.get("/api/notifications", response_model=list[NotificationOut])
def notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [notification_out(n) for n in rows if n]


@app.get("/api/notifications/unread-count", response_model=UnreadCountOut)
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.user_id == user.id, Notification.read == False).count()
    return UnreadCountOut(count=count)


@app.patch("/api/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    if n.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your notification")
    n.read = True
    db.commit()
    db.refresh(n)
    return notification_out(n)


@app.post("/api/notifications/read-all", status_code=204)
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id).update({"read": True})
    db.commit()
