"""Ensure student submission files exist on disk (local + Render)."""

from __future__ import annotations

import re
import zipfile
from io import BytesIO
from pathlib import Path

from sqlalchemy.orm import Session

from app.files import UPLOAD_DIR, ensure_upload_dir, minimal_pdf_bytes, write_demo_pdf
from app.models import Submission


def submission_slug(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
    return slug[:40] or "submission"


def stored_name_for_submission(project_id: int, title: str, ext: str) -> str:
    ext = ext if ext.startswith(".") else f".{ext}"
    return f"demo_{project_id}_{submission_slug(title)}{ext}"


def minimal_docx_bytes(title: str, body: str) -> bytes:
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""
    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="R1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""
    safe_title = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    safe_body = body.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>{safe_title}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{safe_body}</w:t></w:r></w:p>
  </w:body>
</w:document>"""
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", rels)
        archive.writestr("word/document.xml", document)
    return buffer.getvalue()


def demo_document_bytes(
    *,
    title: str,
    student_name: str,
    project_title: str,
    notes: str,
    ext: str,
) -> bytes:
    body = (
        f"University of Kigali — Capstone Submission\n"
        f"Student: {student_name}\n"
        f"Project: {project_title}\n"
        f"Document: {title}\n\n"
        f"{notes}"
    )
    if ext.lower() == ".docx":
        return minimal_docx_bytes(title, body)
    return minimal_pdf_bytes(body)


def write_demo_submission_file(
    stored_name: str,
    *,
    title: str,
    student_name: str,
    project_title: str,
    notes: str,
    force: bool = False,
) -> str:
    ensure_upload_dir()
    path = UPLOAD_DIR / stored_name
    if path.exists() and not force:
        return f"/api/files/{stored_name}"

    ext = path.suffix.lower() or ".pdf"
    path.write_bytes(
        demo_document_bytes(
            title=title,
            student_name=student_name,
            project_title=project_title,
            notes=notes,
            ext=ext,
        )
    )
    return f"/api/files/{stored_name}"


def filename_from_file_url(file_url: str | None) -> str | None:
    if not file_url:
        return None
    return Path(file_url.split("/")[-1]).name


def ensure_submission_file(submission: Submission, *, force: bool = False) -> Path | None:
    filename = filename_from_file_url(submission.file_url)
    if not filename:
        return None

    student_name = "Student"
    project_title = "Capstone Project"
    if submission.project:
        if submission.project.student:
            student_name = submission.project.student.full_name
        project_title = submission.project.title

    write_demo_submission_file(
        filename,
        title=submission.title,
        student_name=student_name,
        project_title=project_title,
        notes=submission.notes or "Submitted via the E-Supervision Portal.",
        force=force,
    )
    return UPLOAD_DIR / filename


def ensure_all_submission_files(db: Session, *, force: bool = False) -> int:
    from sqlalchemy.orm import joinedload

    from app.models import Project

    submissions = (
        db.query(Submission)
        .options(joinedload(Submission.project).joinedload(Project.student))
        .filter(Submission.file_url.isnot(None))
        .all()
    )
    count = 0
    for submission in submissions:
        if ensure_submission_file(submission, force=force):
            count += 1
    return count


def regenerate_submission_file(db: Session, filename: str) -> Path | None:
    from sqlalchemy.orm import joinedload

    from app.models import Project

    safe = Path(filename).name
    submission = (
        db.query(Submission)
        .options(joinedload(Submission.project).joinedload(Project.student))
        .filter(Submission.file_url.isnot(None))
        .filter(Submission.file_url.like(f"%/{safe}"))
        .first()
    )
    if not submission:
        return None
    return ensure_submission_file(submission, force=True)
