from datetime import datetime, timezone
from zoneinfo import ZoneInfo

KIGALI_TZ = ZoneInfo("Africa/Kigali")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def to_kigali(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return ensure_utc(dt).astimezone(KIGALI_TZ)
