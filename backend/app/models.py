import enum
from datetime import date, datetime

from app.datetime_utils import utc_now

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Role(str, enum.Enum):
    STUDENT = "STUDENT"
    SUPERVISOR = "SUPERVISOR"
    HOD = "HOD"


class ProjectStatus(str, enum.Enum):
    PROPOSAL = "PROPOSAL"
    IN_PROGRESS = "IN_PROGRESS"
    UNDER_REVIEW = "UNDER_REVIEW"
    REVISION = "REVISION"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"


class TaskStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class SubmissionStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    NEEDS_REVISION = "NEEDS_REVISION"


class NotificationType(str, enum.Enum):
    DEADLINE = "DEADLINE"
    FEEDBACK = "FEEDBACK"
    ASSIGNMENT = "ASSIGNMENT"
    SYSTEM = "SYSTEM"
    APPROVAL = "APPROVAL"


class ProposalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    department = Column(String)
    title = Column(String)
    program = Column(String)
    phone = Column(String)
    avatar_url = Column(String)
    bio = Column(Text)
    active = Column(Boolean, default=True)
    registration_number = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    current_phase = Column(String)
    status = Column(Enum(ProjectStatus), nullable=False)
    progress = Column(Integer, default=0)
    start_date = Column(Date)
    due_date = Column(Date)
    student_id = Column(Integer, ForeignKey("users.id"))
    supervisor_id = Column(Integer, ForeignKey("users.id"))

    student = relationship("User", foreign_keys=[student_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    status = Column(Enum(TaskStatus), nullable=False)
    priority = Column(Enum(Priority))
    progress = Column(Integer, default=0)
    due_date = Column(Date)
    milestone = Column(Boolean, default=False)
    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship("Project")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    notes = Column(Text)
    file_url = Column(String)
    file_name = Column(String)
    status = Column(Enum(SubmissionStatus), nullable=False)
    submitted_at = Column(DateTime, default=utc_now)
    project_id = Column(Integer, ForeignKey("projects.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    project = relationship("Project")
    task = relationship("Task")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    project_id = Column(Integer, ForeignKey("projects.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)

    project = relationship("Project")
    author = relationship("User")
    submission = relationship("Submission")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    message = Column(Text)
    type = Column(Enum(NotificationType), nullable=False)
    severity = Column(Enum(Priority))
    read = Column(Boolean, default=False)
    action_path = Column(String)
    created_at = Column(DateTime, default=utc_now)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User")


class TopicProposal(Base):
    __tablename__ = "topic_proposals"

    id = Column(Integer, primary_key=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    registration_number = Column(String, nullable=False, index=True)
    phone = Column(String)
    program = Column(String, nullable=False)
    department = Column(String, nullable=False, index=True)
    topic_1 = Column(String, nullable=False)
    abstract_1 = Column(Text, nullable=False)
    topic_2 = Column(String, nullable=False)
    abstract_2 = Column(Text, nullable=False)
    topic_3 = Column(String, nullable=False)
    abstract_3 = Column(Text, nullable=False)
    supervisor_choice_1_id = Column(Integer, ForeignKey("users.id"))
    supervisor_choice_2_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ProposalStatus), default=ProposalStatus.PENDING)
    selected_topic_index = Column(Integer, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    assigned_supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    supervisor_choice_1 = relationship("User", foreign_keys=[supervisor_choice_1_id])
    supervisor_choice_2 = relationship("User", foreign_keys=[supervisor_choice_2_id])
    assigned_supervisor = relationship("User", foreign_keys=[assigned_supervisor_id])


class SupervisorStudentRequest(Base):
    __tablename__ = "supervisor_student_requests"

    id = Column(Integer, primary_key=True)
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING)
    hod_response = Column(Text)
    created_at = Column(DateTime, default=utc_now)

    supervisor = relationship("User")
