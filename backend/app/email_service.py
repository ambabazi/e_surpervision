import logging
import re
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)

GMAIL_PATTERN = re.compile(r"@(gmail|googlemail)\.com$", re.IGNORECASE)


def send_email(*, to: str, subject: str, body: str) -> None:
    if settings.mail_enabled and settings.smtp_host:
        msg = EmailMessage()
        msg["From"] = settings.mail_from
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
        logger.info("Email sent to %s: %s", to, subject)
        return

    logger.info(
        "EMAIL (dev — not sent)\n  To: %s\n  Subject: %s\n  Body:\n%s",
        to,
        subject,
        body,
    )


def student_notification_email(email: str | None) -> str | None:
    """Return address for external student notifications (Gmail, etc.)."""
    if not email or "@" not in email:
        return None
    normalized = email.strip().lower()
    if normalized.endswith("@uok.ac.rw") or normalized.endswith("@st.uok.ac.rw"):
        return None
    return normalized


def notify_proposal_approved(
    *,
    to: str,
    full_name: str,
    registration_number: str,
    topic_title: str,
    supervisor_name: str,
    student_password: str,
) -> None:
    send_email(
        to=to,
        subject="UoK Capstone — Your topic proposal was approved",
        body=(
            f"Dear {full_name},\n\n"
            f"Your capstone topic proposal has been approved by the Head of Department.\n\n"
            f"Registration number: {registration_number}\n"
            f"Approved topic: {topic_title}\n"
            f"Assigned supervisor: {supervisor_name}\n\n"
            f"Your student portal account has been created.\n"
            f"  Sign-in ID: {registration_number}\n"
            f"  Password: {student_password} (same as your registration number)\n\n"
            f"Sign in at the student portal. You stay signed in for up to 48 hours.\n\n"
            f"University of Kigali — Capstone E-Supervision Portal"
        ),
    )


def notify_proposal_rejected(
    *,
    to: str,
    full_name: str,
    registration_number: str,
    reason: str | None = None,
) -> None:
    reason_text = reason.strip() if reason else "No additional reason was provided."
    send_email(
        to=to,
        subject="UoK Capstone — Your topic proposal was not approved",
        body=(
            f"Dear {full_name},\n\n"
            f"Thank you for submitting your capstone topic proposal (reg. {registration_number}). "
            f"After review, the Head of Department was unable to approve your submission at this time.\n\n"
            f"Reason: {reason_text}\n\n"
            f"Please contact the department office if you have questions or wish to submit revised topics.\n\n"
            f"University of Kigali — Capstone E-Supervision Portal"
        ),
    )


def notify_submission_received(
    *,
    to: str,
    full_name: str,
    submission_title: str,
    project_title: str,
) -> None:
    send_email(
        to=to,
        subject="UoK Capstone — Submission received",
        body=(
            f"Dear {full_name},\n\n"
            f"We received your submission \"{submission_title}\" for project \"{project_title}\".\n"
            f"Your supervisor will review it within 7 days. You will receive another email when feedback is ready.\n\n"
            f"Track progress in the student portal.\n\n"
            f"University of Kigali — Capstone E-Supervision Portal"
        ),
    )


def notify_submission_reviewed(
    *,
    to: str,
    full_name: str,
    submission_title: str,
    review_status: str,
    feedback: str | None,
    supervisor_name: str,
    project_progress: int | None = None,
) -> None:
    feedback_block = (
        f"\nSupervisor feedback:\n{feedback.strip()}\n"
        if feedback and feedback.strip()
        else "\nNo written feedback was attached to this review.\n"
    )
    progress_line = (
        f"\nOverall project progress: {project_progress}%\n"
        if project_progress is not None
        else ""
    )
    send_email(
        to=to,
        subject=f"UoK Capstone — Update on \"{submission_title}\"",
        body=(
            f"Dear {full_name},\n\n"
            f"{supervisor_name} has reviewed your submission \"{submission_title}\".\n\n"
            f"Review outcome: {review_status.replace('_', ' ')}\n"
            f"{feedback_block}"
            f"{progress_line}\n"
            f"Open the student portal for full details and next steps.\n\n"
            f"University of Kigali — Capstone E-Supervision Portal"
        ),
    )


def notify_progress_reminder(
    *,
    to: str,
    full_name: str,
    project_title: str,
    message: str,
    due_date: str | None = None,
) -> None:
    due_line = f"\nDue date: {due_date}\n" if due_date else ""
    send_email(
        to=to,
        subject=f"UoK Capstone — Progress reminder: {project_title}",
        body=(
            f"Dear {full_name},\n\n"
            f"{message}\n"
            f"{due_line}\n"
            f"University of Kigali — Capstone E-Supervision Portal"
        ),
    )
