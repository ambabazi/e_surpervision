from datetime import datetime
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from app.models import (
    NotificationType,
    Priority,
    ProjectStatus,
    ProposalStatus,
    RequestStatus,
    Role,
    SubmissionStatus,
    TaskStatus,
)


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,
    )


class UserOut(CamelModel):
    id: int
    full_name: str
    email: str
    role: Role
    department: Optional[str] = None
    title: Optional[str] = None
    program: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    registration_number: Optional[str] = None


class ProjectOut(CamelModel):
    id: int
    title: str
    description: Optional[str] = None
    current_phase: Optional[str] = None
    status: ProjectStatus
    progress: int
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    days_remaining: Optional[int] = None
    student: Optional[UserOut] = None
    supervisor: Optional[UserOut] = None


class TaskOut(CamelModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: TaskStatus
    priority: Optional[Priority] = None
    progress: int
    due_date: Optional[str] = None
    milestone: bool
    project_id: Optional[int] = None


class SubmissionOut(CamelModel):
    id: int
    title: str
    notes: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    student: Optional[UserOut] = None


class FeedbackOut(CamelModel):
    id: int
    title: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None
    project_id: Optional[int] = None
    author: Optional[UserOut] = None


class NotificationOut(CamelModel):
    id: int
    title: str
    message: Optional[str] = None
    type: NotificationType
    severity: Optional[Priority] = None
    read: bool
    action_path: Optional[str] = None
    created_at: Optional[datetime] = None


class StudentDashboardOut(CamelModel):
    student: UserOut
    project: ProjectOut
    supervisor: Optional[UserOut] = None
    upcoming_tasks: list[TaskOut]
    recent_feedback: list[FeedbackOut]
    recent_submissions: list[SubmissionOut]
    unread_notifications: int
    next_milestone: Optional[TaskOut] = None


class TaskBoardOut(CamelModel):
    project: ProjectOut
    overall_progress: int
    next_milestone: Optional[TaskOut] = None
    days_to_milestone: Optional[int] = None
    tasks: list[TaskOut]
    status_counts: dict[str, int]


class PipelineRowOut(CamelModel):
    project_id: int
    student_name: str
    project_title: str
    current_phase: Optional[str] = None
    status: str
    progress: int


class PendingReviewOut(SubmissionOut):
    hours_waiting: int
    review_deadline_hours: int
    hours_until_deadline: int
    is_overdue: bool


class SupervisorDashboardOut(CamelModel):
    supervisor: UserOut
    total_students: int
    pending_reviews: int
    active_projects: int
    completed_projects: int
    pending_thesis_reviews: list[PendingReviewOut]
    critical_alerts: list[NotificationOut]
    research_pipeline: list[PipelineRowOut]


class SupervisorWorkloadOut(CamelModel):
    supervisor_id: int
    name: str
    title: Optional[str] = None
    load: int
    capacity: int
    status: str


class HodDashboardOut(CamelModel):
    faculty_performance: float
    total_students: int
    total_supervisors: int
    active_projects: int
    unassigned_count: int
    pending_proposals: int
    pending_supervisor_requests: int
    supervisor_workload: list[SupervisorWorkloadOut]
    unassigned_students: list[UserOut]
    project_status_breakdown: dict[str, int]


class SupervisorStudentOut(CamelModel):
    project: ProjectOut
    pending_submissions: int
    total_submissions: int
    last_submission_title: Optional[str] = None
    last_submission_at: Optional[datetime] = None
    completed_milestones: int
    total_milestones: int


class SupervisorFacultyStatOut(CamelModel):
    supervisor_id: int
    name: str
    title: Optional[str] = None
    student_count: int
    avg_progress: float
    completed_projects: int
    at_risk_count: int


class HodFacultyOverviewOut(CamelModel):
    faculty_performance: float
    on_track_count: int
    at_risk_count: int
    completed_count: int
    total_projects: int
    supervisor_stats: list[SupervisorFacultyStatOut]
    progress_by_program: dict[str, float]


class LoginRequest(BaseModel):
    email: str
    password: str
    portal: Optional[Role] = None


class AuthResponse(CamelModel):
    token: str
    user: UserOut


class CreateSubmissionRequest(BaseModel):
    title: str
    notes: Optional[str] = None
    file_url: Optional[str] = Field(None, alias="fileUrl")
    file_name: Optional[str] = Field(None, alias="fileName")
    task_id: Optional[int] = Field(None, alias="taskId")

    model_config = ConfigDict(populate_by_name=True)


class ReviewSubmissionRequest(BaseModel):
    status: str
    feedback: Optional[str] = None


class PublicSupervisorOut(CamelModel):
    id: int
    full_name: str
    title: Optional[str] = None
    department: Optional[str] = None
    load: int = 0
    capacity: int = 8
    spots_available: int = 0


class TopicOptionOut(CamelModel):
    topic_index: int
    topic: str
    abstract: str
    similarity_score: float
    similarity_level: str


class TopicProposalOut(CamelModel):
    id: int
    full_name: str
    email: str
    registration_number: str
    phone: Optional[str] = None
    program: str
    department: str
    topics: list[TopicOptionOut]
    supervisor_choice_1: Optional[UserOut] = None
    supervisor_choice_2: Optional[UserOut] = None
    status: ProposalStatus
    selected_topic_index: Optional[int] = None
    rejection_reason: Optional[str] = None
    assigned_supervisor: Optional[UserOut] = None
    student_user_id: Optional[int] = None
    created_at: Optional[datetime] = None


class TopicProposalCreateRequest(BaseModel):
    full_name: str = Field(alias="fullName")
    email: EmailStr
    registration_number: str = Field(alias="registrationNumber")
    phone: Optional[str] = None
    program: str
    topic_1: str = Field(alias="topic1")
    abstract_1: str = Field(alias="abstract1")
    topic_2: str = Field(alias="topic2")
    abstract_2: str = Field(alias="abstract2")
    topic_3: str = Field(alias="topic3")
    abstract_3: str = Field(alias="abstract3")
    supervisor_choice_1_id: int = Field(alias="supervisorChoice1Id")
    supervisor_choice_2_id: int = Field(alias="supervisorChoice2Id")

    model_config = ConfigDict(populate_by_name=True)


class ApproveProposalRequest(BaseModel):
    registration_number: Optional[str] = Field(None, alias="registrationNumber")
    selected_topic_index: int = Field(alias="selectedTopicIndex")
    supervisor_id: int = Field(alias="supervisorId")

    model_config = ConfigDict(populate_by_name=True)


class ProposalStatsOut(CamelModel):
    pending: int
    approved: int
    rejected: int
    total: int


class ActiveProjectOut(CamelModel):
    id: int
    title: str
    description: Optional[str] = None
    status: ProjectStatus
    progress: int
    student_name: Optional[str] = None
    supervisor_name: Optional[str] = None
    program: Optional[str] = None


class HodProposalPipelineOut(CamelModel):
    stats: ProposalStatsOut
    proposals: list[TopicProposalOut]
    active_projects: list[ActiveProjectOut]
    department: str


class RejectProposalRequest(BaseModel):
    reason: Optional[str] = None


class CreateStudentRequest(BaseModel):
    full_name: str = Field(alias="fullName")
    registration_number: str = Field(alias="registrationNumber")
    email: EmailStr
    program: str
    phone: Optional[str] = None
    supervisor_id: int = Field(alias="supervisorId")
    project_title: str = Field(alias="projectTitle")
    project_description: Optional[str] = Field(None, alias="projectDescription")

    model_config = ConfigDict(populate_by_name=True)


class SupervisorStudentRequestCreate(BaseModel):
    message: str


class SupervisorStudentRequestOut(CamelModel):
    id: int
    message: str
    status: RequestStatus
    hod_response: Optional[str] = None
    created_at: Optional[datetime] = None
    supervisor: Optional[UserOut] = None


class HodStudentRequestOut(CamelModel):
    id: int
    message: str
    status: RequestStatus
    hod_response: Optional[str] = None
    created_at: Optional[datetime] = None
    supervisor: Optional[UserOut] = None


class RespondStudentRequestBody(BaseModel):
    status: str
    response: Optional[str] = None


class UnreadCountOut(CamelModel):
    count: int


class HealthOut(CamelModel):
    status: str
    service: str


class ErrorOut(CamelModel):
    timestamp: str
    status: int
    error: str
    message: str
