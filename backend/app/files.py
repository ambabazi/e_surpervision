import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
ALLOWED_MIME = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
}
MAX_BYTES = 10 * 1024 * 1024


def ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def validate_upload(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A file is required.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Only PDF and Word documents (.pdf, .doc, .docx) are allowed.",
        )

    if file.content_type and file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Invalid file type. Please upload a PDF or Word document.",
        )


def safe_filename(original: str) -> str:
    stem = re.sub(r"[^a-zA-Z0-9._-]+", "_", Path(original).stem)[:80] or "document"
    ext = Path(original).suffix.lower()
    return f"{stem}_{uuid.uuid4().hex[:8]}{ext}"


async def save_upload(file: UploadFile) -> tuple[str, str]:
    validate_upload(file)
    ensure_upload_dir()
    stored = safe_filename(file.filename)
    path = UPLOAD_DIR / stored

    content = await file.read()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The uploaded file is empty.")
    if len(content) > MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is too large. Maximum size is 10 MB.")

    path.write_bytes(content)
    return stored, f"/api/files/{stored}"
