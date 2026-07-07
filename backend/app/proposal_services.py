from datetime import date, datetime, timedelta

from app.datetime_utils import ensure_utc, to_kigali, utc_now

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import hash_password
from app.models import (
    Notification,
    NotificationType,
    Priority,
    Project,
    ProjectStatus,
    ProposalStatus,
    RequestStatus,
    Role,
    SupervisorStudentRequest,
    TopicProposal,
    User,
)
from app.schemas import (
    ApproveProposalRequest,
    CreateStudentRequest,
    HodProposalPipelineOut,
    HodStudentRequestOut,
    PublicSupervisorOut,
    RejectProposalRequest,
    RespondStudentRequestBody,
    SupervisorStudentRequestOut,
    TopicOptionOut,
    TopicProposalCreateRequest,
    TopicProposalOut,
    UserOut,
)
from app.services import user_out, supervisor_load, DEFAULT_CAPACITY
from app.similarity import score_proposal_topics
from app.demo_credentials import format_registration_number, student_password
from app.email_service import notify_proposal_approved, notify_proposal_rejected
from app.departments import Department, department_for_program, parse_department
from app.submission_policy import priority_label

REVIEW_DEADLINE_HOURS = 168  # 7 days


def _normalize_reg(reg: str) -> str:
    return format_registration_number(reg)


def _ensure_reg_available_for_proposal(db: Session, reg: str, *, exclude_proposal_id: int | None = None) -> None:
    reg = _normalize_reg(reg)
    if db.query(User).filter(User.registration_number == reg).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "This registration number is already registered in the portal")
    q = db.query(TopicProposal).filter(
        TopicProposal.registration_number == reg,
        TopicProposal.status == ProposalStatus.PENDING,
    )
    if exclude_proposal_id:
        q = q.filter(TopicProposal.id != exclude_proposal_id)
    if q.first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A pending proposal already exists for this registration number")


def _hod_for_department(db: Session, department: Department) -> User | None:
    return (
        db.query(User)
        .filter(User.role == Role.HOD, User.department == department.value)
        .first()
    )


def existing_project_corpus(db: Session, department: str | None = None) -> list[tuple[str, str]]:
    q = db.query(Project).filter(Project.status != ProjectStatus.COMPLETED)
    if department:
        q = q.join(User, Project.supervisor_id == User.id).filter(User.department == department)
    rows = q.all()
    return [(p.title, p.description or "") for p in rows]


def topic_option_out(index: int, topic: str, abstract: str, existing: list[tuple[str, str]]) -> TopicOptionOut:
    scores = score_proposal_topics([(topic, abstract)], existing)
    s = scores[0]
    return TopicOptionOut(
        topic_index=index,
        topic=topic,
        abstract=abstract,
        similarity_score=s["similarityScore"],
        similarity_level=s["similarityLevel"],
    )


def proposal_out(db: Session, p: TopicProposal) -> TopicProposalOut:
    existing = existing_project_corpus(db, p.department)
    topics = [
        topic_option_out(1, p.topic_1, p.abstract_1, existing),
        topic_option_out(2, p.topic_2, p.abstract_2, existing),
        topic_option_out(3, p.topic_3, p.abstract_3, existing),
    ]
    return TopicProposalOut(
        id=p.id,
        full_name=p.full_name,
        email=p.email,
        registration_number=p.registration_number,
        phone=p.phone,
        program=p.program,
        department=p.department,
        topics=topics,
        supervisor_choice_1=user_out(p.supervisor_choice_1),
        supervisor_choice_2=user_out(p.supervisor_choice_2),
        status=p.status,
        selected_topic_index=p.selected_topic_index,
        rejection_reason=p.rejection_reason,
        assigned_supervisor=user_out(p.assigned_supervisor),
        student_user_id=p.student_user_id,
        created_at=p.created_at,
    )


def list_public_supervisors(db: Session, *, department: str) -> list[PublicSupervisorOut]:
    try:
        dept = parse_department(department)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid department. Use IT, LAW, BUSINESS, or EDUCATION")

    rows = (
        db.query(User)
        .filter(User.role == Role.SUPERVISOR, User.active == True, User.department == dept.value)
        .order_by(User.full_name.asc())
        .all()
    )
    available = []
    for s in rows:
        load = supervisor_load(db, s.id)
        if load >= DEFAULT_CAPACITY:
            continue
        available.append(
            PublicSupervisorOut(
                id=s.id,
                full_name=s.full_name,
                title=s.title,
                department=s.department,
                load=load,
                capacity=DEFAULT_CAPACITY,
                spots_available=DEFAULT_CAPACITY - load,
            )
        )
    return available


def create_topic_proposal(db: Session, body: TopicProposalCreateRequest) -> TopicProposalOut:
    if body.supervisor_choice_1_id == body.supervisor_choice_2_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please choose two different supervisors")

    try:
        reg = _normalize_reg(body.registration_number)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    _ensure_reg_available_for_proposal(db, reg)

    try:
        dept = department_for_program(body.program.strip())
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    for sid in (body.supervisor_choice_1_id, body.supervisor_choice_2_id):
        sup = db.query(User).filter(User.id == sid, User.role == Role.SUPERVISOR).first()
        if not sup:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Supervisor id {sid} not found")
        if sup.department != dept.value:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Selected supervisors must belong to your department")
        if supervisor_load(db, sup.id) >= DEFAULT_CAPACITY:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{sup.full_name} has no available supervision spots")

    proposal = TopicProposal(
        full_name=body.full_name.strip(),
        email=body.email.strip().lower(),
        registration_number=reg,
        phone=body.phone.strip() if body.phone else None,
        program=body.program.strip(),
        department=dept.value,
        topic_1=body.topic_1.strip(),
        abstract_1=body.abstract_1.strip(),
        topic_2=body.topic_2.strip(),
        abstract_2=body.abstract_2.strip(),
        topic_3=body.topic_3.strip(),
        abstract_3=body.abstract_3.strip(),
        supervisor_choice_1_id=body.supervisor_choice_1_id,
        supervisor_choice_2_id=body.supervisor_choice_2_id,
    )
    db.add(proposal)
    db.flush()

    hod = _hod_for_department(db, dept)
    if hod:
        db.add(
            Notification(
                title="New topic proposal",
                message=f"{proposal.full_name} ({dept.value}) submitted 3 capstone topics for review.",
                type=NotificationType.APPROVAL,
                severity=Priority.MEDIUM,
                user_id=hod.id,
                action_path="/hod/proposals",
            )
        )
    db.commit()
    db.refresh(proposal)
    return proposal_out(db, proposal)


def list_topic_proposals(
    db: Session, *, status_filter: ProposalStatus | None = None, department: str | None = None
) -> list[TopicProposalOut]:
    q = (
        db.query(TopicProposal)
        .options(
            joinedload(TopicProposal.supervisor_choice_1),
            joinedload(TopicProposal.supervisor_choice_2),
            joinedload(TopicProposal.assigned_supervisor),
        )
        .order_by(TopicProposal.created_at.desc())
    )
    if status_filter:
        q = q.filter(TopicProposal.status == status_filter)
    if department:
        q = q.filter(TopicProposal.department == department)
    return [proposal_out(db, p) for p in q.all()]


def _ensure_reg_available(db: Session, reg: str) -> None:
    reg = _normalize_reg(reg)
    if db.query(User).filter(User.registration_number == reg).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A student with this registration number already exists")


def _create_student_user(
    db: Session,
    *,
    full_name: str,
    email: str,
    program: str,
    registration_number: str,
    phone: str | None = None,
    department: str | None = None,
) -> User:
    reg = _normalize_reg(registration_number)
    _ensure_reg_available(db, reg)
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists")

    student = User(
        full_name=full_name,
        email=email.lower(),
        password=hash_password(student_password(reg)),
        role=Role.STUDENT,
        program=program,
        phone=phone,
        registration_number=reg,
        department=department,
        active=True,
    )
    db.add(student)
    db.flush()
    return student


def active_projects_out(db: Session, department: str | None = None):
    from app.schemas import ActiveProjectOut

    q = (
        db.query(Project)
        .options(joinedload(Project.student), joinedload(Project.supervisor))
        .filter(Project.status != ProjectStatus.COMPLETED)
    )
    if department:
        q = q.join(User, Project.supervisor_id == User.id).filter(User.department == department)
    rows = q.order_by(Project.title.asc()).all()
    return [
        ActiveProjectOut(
            id=p.id,
            title=p.title,
            description=p.description,
            status=p.status,
            progress=p.progress,
            student_name=p.student.full_name if p.student else None,
            supervisor_name=p.supervisor.full_name if p.supervisor else None,
            program=p.student.program if p.student else None,
        )
        for p in rows
    ]


def hod_proposal_pipeline(
    db: Session, hod: User, *, status_filter: ProposalStatus | None = None
) -> HodProposalPipelineOut:
    from app.schemas import ProposalStatsOut

    dept = hod.department or Department.IT.value
    base = db.query(TopicProposal).filter(TopicProposal.department == dept)
    pending = base.filter(TopicProposal.status == ProposalStatus.PENDING).count()
    approved = base.filter(TopicProposal.status == ProposalStatus.APPROVED).count()
    rejected = base.filter(TopicProposal.status == ProposalStatus.REJECTED).count()

    return HodProposalPipelineOut(
        stats=ProposalStatsOut(
            pending=pending,
            approved=approved,
            rejected=rejected,
            total=pending + approved + rejected,
        ),
        proposals=list_topic_proposals(db, status_filter=status_filter, department=dept),
        active_projects=active_projects_out(db, department=dept),
        department=dept,
    )


def approve_proposal(db: Session, proposal_id: int, body: ApproveProposalRequest) -> TopicProposalOut:
    proposal = (
        db.query(TopicProposal)
        .options(
            joinedload(TopicProposal.supervisor_choice_1),
            joinedload(TopicProposal.supervisor_choice_2),
        )
        .filter(TopicProposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found")
    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This proposal has already been processed")

    if body.selected_topic_index not in (1, 2, 3):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Selected topic must be 1, 2, or 3")

    supervisor = db.query(User).filter(User.id == body.supervisor_id, User.role == Role.SUPERVISOR).first()
    if not supervisor:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Supervisor not found")
    if supervisor.department != proposal.department:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Supervisor must belong to the applicant's department")
    if supervisor_load(db, supervisor.id) >= DEFAULT_CAPACITY:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Selected supervisor has no available spots")

    reg = _normalize_reg(body.registration_number or proposal.registration_number)
    _ensure_reg_available_for_proposal(db, reg, exclude_proposal_id=proposal.id)

    topics = {
        1: (proposal.topic_1, proposal.abstract_1),
        2: (proposal.topic_2, proposal.abstract_2),
        3: (proposal.topic_3, proposal.abstract_3),
    }
    title, abstract = topics[body.selected_topic_index]

    student = _create_student_user(
        db,
        full_name=proposal.full_name,
        email=proposal.email,
        program=proposal.program,
        registration_number=reg,
        phone=proposal.phone,
        department=proposal.department,
    )

    project = Project(
        title=title,
        description=abstract,
        current_phase="Proposal",
        status=ProjectStatus.PROPOSAL,
        progress=5,
        start_date=date.today(),
        due_date=date.today() + timedelta(days=180),
        student_id=student.id,
        supervisor_id=supervisor.id,
    )
    db.add(project)

    proposal.status = ProposalStatus.APPROVED
    proposal.selected_topic_index = body.selected_topic_index
    proposal.assigned_supervisor_id = supervisor.id
    proposal.student_user_id = student.id

    db.add(
        Notification(
            title="New student assigned",
            message=f"{student.full_name} has been assigned to you for capstone supervision.",
            type=NotificationType.ASSIGNMENT,
            severity=Priority.MEDIUM,
            user_id=supervisor.id,
            action_path="/supervisor/students",
        )
    )
    db.add(
        Notification(
            title="Supervisor Assigned",
            message=f"You have been assigned to {supervisor.full_name} for capstone supervision.",
            type=NotificationType.ASSIGNMENT,
            severity=Priority.MEDIUM,
            user_id=student.id,
            action_path="/student",
        )
    )
    db.commit()
    db.refresh(proposal)

    notify_proposal_approved(
        to=proposal.email,
        full_name=proposal.full_name,
        registration_number=reg,
        topic_title=title,
        supervisor_name=supervisor.full_name,
        student_password=student_password(reg),
    )

    return proposal_out(db, proposal)


def reject_proposal(db: Session, proposal_id: int, body: RejectProposalRequest) -> TopicProposalOut:
    proposal = db.query(TopicProposal).filter(TopicProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found")
    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This proposal has already been processed")
    proposal.status = ProposalStatus.REJECTED
    proposal.rejection_reason = body.reason.strip() if body.reason else None
    db.commit()
    db.refresh(proposal)

    notify_proposal_rejected(
        to=proposal.email,
        full_name=proposal.full_name,
        registration_number=proposal.registration_number,
        reason=proposal.rejection_reason,
    )

    return proposal_out(db, proposal)


def hod_create_student(db: Session, body: CreateStudentRequest) -> UserOut:
    supervisor = db.query(User).filter(User.id == body.supervisor_id, User.role == Role.SUPERVISOR).first()
    if not supervisor:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Supervisor not found")

    student = _create_student_user(
        db,
        full_name=body.full_name.strip(),
        email=body.email.strip(),
        program=body.program.strip(),
        registration_number=body.registration_number.strip(),
        phone=body.phone.strip() if body.phone else None,
    )

    db.add(
        Project(
            title=body.project_title.strip(),
            description=body.project_description.strip() if body.project_description else None,
            current_phase="Proposal",
            status=ProjectStatus.PROPOSAL,
            progress=5,
            start_date=date.today(),
            due_date=date.today() + timedelta(days=180),
            student_id=student.id,
            supervisor_id=supervisor.id,
        )
    )

    db.add(
        Notification(
            title="New student assigned",
            message=f"{student.full_name} has been assigned to you.",
            type=NotificationType.ASSIGNMENT,
            severity=Priority.MEDIUM,
            user_id=supervisor.id,
            action_path="/supervisor/students",
        )
    )
    db.commit()
    db.refresh(student)
    return user_out(student)


def hod_assign_student_supervisor(
    db: Session,
    hod: User,
    student_id: int,
    *,
    supervisor_id: int,
    project_title: str | None = None,
    project_description: str | None = None,
) -> UserOut:
    student = db.query(User).filter(User.id == student_id, User.role == Role.STUDENT).first()
    if not student:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")

    if hod.department and student.department != hod.department:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This student is not in your department")

    supervisor = db.query(User).filter(User.id == supervisor_id, User.role == Role.SUPERVISOR).first()
    if not supervisor:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Supervisor not found")
    if hod.department and supervisor.department != hod.department:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Supervisor must be in your department")
    if supervisor_load(db, supervisor.id) >= DEFAULT_CAPACITY:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{supervisor.full_name} has no available supervision spots")

    project = db.query(Project).filter(Project.student_id == student.id).first()
    title = (project_title or student.program or "Capstone Project").strip()
    description = project_description.strip() if project_description else None

    if project:
        if project.supervisor_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Student already has a supervisor assigned")
        project.supervisor_id = supervisor.id
        if not project.title:
            project.title = title
    else:
        db.add(
            Project(
                title=title,
                description=description or f"Capstone project for {student.full_name}.",
                current_phase="Proposal",
                status=ProjectStatus.PROPOSAL,
                progress=5,
                start_date=date.today(),
                due_date=date.today() + timedelta(days=180),
                student_id=student.id,
                supervisor_id=supervisor.id,
            )
        )

    db.add(
        Notification(
            title="New student assigned",
            message=f"{student.full_name} has been assigned to you for capstone supervision.",
            type=NotificationType.ASSIGNMENT,
            severity=Priority.MEDIUM,
            user_id=supervisor.id,
            action_path="/supervisor/students",
        )
    )
    db.add(
        Notification(
            title="Supervisor Assigned",
            message=f"You have been assigned to {supervisor.full_name} for capstone supervision.",
            type=NotificationType.ASSIGNMENT,
            severity=Priority.MEDIUM,
            user_id=student.id,
            action_path="/student",
        )
    )
    db.commit()
    db.refresh(student)
    return user_out(student)


def create_supervisor_request(db: Session, supervisor: User, message: str) -> SupervisorStudentRequestOut:
    if not message.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please provide a message for the HOD")

    req = SupervisorStudentRequest(supervisor_id=supervisor.id, message=message.strip())
    db.add(req)
    db.flush()

    hod = db.query(User).filter(User.role == Role.HOD, User.department == supervisor.department).first()
    if hod:
        db.add(
            Notification(
                title="Supervisor student request",
                message=f"{supervisor.full_name} requested an additional student.",
                type=NotificationType.APPROVAL,
                severity=Priority.MEDIUM,
                user_id=hod.id,
                action_path="/hod/requests",
            )
        )
    db.commit()
    db.refresh(req)
    req = (
        db.query(SupervisorStudentRequest)
        .options(joinedload(SupervisorStudentRequest.supervisor))
        .filter(SupervisorStudentRequest.id == req.id)
        .first()
    )
    return supervisor_request_out(req)


def supervisor_request_out(r: SupervisorStudentRequest) -> SupervisorStudentRequestOut:
    return SupervisorStudentRequestOut(
        id=r.id,
        message=r.message,
        status=r.status,
        hod_response=r.hod_response,
        created_at=r.created_at,
        supervisor=user_out(r.supervisor),
    )


def hod_student_request_out(r: SupervisorStudentRequest) -> HodStudentRequestOut:
    return HodStudentRequestOut(
        id=r.id,
        message=r.message,
        status=r.status,
        hod_response=r.hod_response,
        created_at=r.created_at,
        supervisor=user_out(r.supervisor),
    )


def list_supervisor_requests(db: Session, supervisor: User) -> list[SupervisorStudentRequestOut]:
    rows = (
        db.query(SupervisorStudentRequest)
        .options(joinedload(SupervisorStudentRequest.supervisor))
        .filter(SupervisorStudentRequest.supervisor_id == supervisor.id)
        .order_by(SupervisorStudentRequest.created_at.desc())
        .all()
    )
    return [supervisor_request_out(r) for r in rows]


def list_hod_student_requests(db: Session) -> list[HodStudentRequestOut]:
    rows = (
        db.query(SupervisorStudentRequest)
        .options(joinedload(SupervisorStudentRequest.supervisor))
        .order_by(SupervisorStudentRequest.created_at.desc())
        .all()
    )
    return [hod_student_request_out(r) for r in rows]


def respond_hod_student_request(
    db: Session, request_id: int, body: RespondStudentRequestBody
) -> HodStudentRequestOut:
    req = (
        db.query(SupervisorStudentRequest)
        .options(joinedload(SupervisorStudentRequest.supervisor))
        .filter(SupervisorStudentRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if req.status != RequestStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Request already processed")

    try:
        req.status = RequestStatus(body.status)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Status must be APPROVED or REJECTED")

    req.hod_response = body.response.strip() if body.response else None

    if req.supervisor:
        db.add(
            Notification(
                title="Student request update",
                message=f"Your request was {req.status.name.lower()}.",
                type=NotificationType.SYSTEM,
                severity=Priority.MEDIUM,
                user_id=req.supervisor_id,
                action_path="/supervisor",
            )
        )
    db.commit()
    db.refresh(req)
    return hod_student_request_out(req)


def pending_review_out(submission, existing=None):
    from app.schemas import PendingReviewOut
    from app.services import submission_out

    base = submission_out(submission)
    hours_waiting = 0
    hours_until = REVIEW_DEADLINE_HOURS
    is_overdue = False
    if submission.submitted_at:
        now = utc_now()
        submitted = ensure_utc(submission.submitted_at)
        elapsed = now - submitted
        hours_waiting = max(0, int(elapsed.total_seconds() // 3600))
        hours_until = max(0, REVIEW_DEADLINE_HOURS - hours_waiting)
        is_overdue = hours_waiting >= REVIEW_DEADLINE_HOURS
        kigali_submitted = to_kigali(submitted)
        submitted_hour = kigali_submitted.hour if kigali_submitted else None
    else:
        submitted_hour = None

    return PendingReviewOut(
        **base.model_dump(),
        hours_waiting=hours_waiting,
        review_deadline_hours=REVIEW_DEADLINE_HOURS,
        hours_until_deadline=hours_until,
        is_overdue=is_overdue,
        submitted_hour=submitted_hour,
        priority_label=priority_label(submission.submitted_at),
    )
