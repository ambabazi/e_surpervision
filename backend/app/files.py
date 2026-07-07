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


def minimal_pdf_bytes(title: str) -> bytes:
    text = title[:80].replace("(", "[").replace(")", "]")
    stream = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET"
    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
        ),
        f"4 0 obj<< /Length {len(stream)} >>stream\n{stream}\nendstream\nendobj\n".encode(),
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ]
    body = b"".join(objects)
    xref_offset = len(body) + 8
    xref = (
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000244 00000 n \n"
        b"0000000350 00000 n \n"
    )
    trailer = f"trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode()
    return b"%PDF-1.4\n" + body + xref + trailer


def write_demo_pdf(stored_name: str, title: str) -> str:
    ensure_upload_dir()
    path = UPLOAD_DIR / stored_name
    if not path.exists():
        path.write_bytes(minimal_pdf_bytes(title))
    return f"/api/files/{stored_name}"


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
