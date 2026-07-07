from datetime import datetime, timezone

from fastapi import HTTPException, status
from zoneinfo import ZoneInfo

from app.config import settings
from app.datetime_utils import ensure_utc, to_kigali


def submission_now() -> datetime:
    return datetime.now(ZoneInfo(settings.submission_timezone))


def validate_submission_window() -> None:
    if not settings.submission_window_enabled:
        return

    now = submission_now()
    start = settings.submission_window_start_hour
    end = settings.submission_window_end_hour
    if start <= now.hour < end:
        return

    raise HTTPException(
        status.HTTP_400_BAD_REQUEST,
        f"Submissions are accepted between {start:02d}:00 and {end:02d}:00 "
        f"({settings.submission_timezone}). Current time: {now.strftime('%H:%M')}. "
        "Morning submissions are reviewed before afternoon ones.",
    )


def submission_priority_key(submitted_at: datetime | None) -> tuple[int, datetime]:
    """Earlier Kigali hour = higher priority (sorted ascending)."""
    if not submitted_at:
        return (999, datetime.max.replace(tzinfo=timezone.utc))
    kigali = to_kigali(submitted_at)
    hour = kigali.hour if kigali else submitted_at.hour
    return (hour, ensure_utc(submitted_at))


def priority_label(submitted_at: datetime | None) -> str:
    if not submitted_at:
        return "Unknown time"
    kigali = to_kigali(submitted_at)
    hour = kigali.hour if kigali else submitted_at.hour
    if hour < 12:
        return "Morning — high queue priority"
    if hour < settings.submission_window_end_hour:
        return "Afternoon"
    return "Outside standard window"


def sort_submissions_by_priority(submissions: list) -> list:
    return sorted(submissions, key=lambda s: submission_priority_key(s.submitted_at))
