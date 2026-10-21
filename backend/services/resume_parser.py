"""Turn an uploaded PDF/DOCX into plain text, with strict validation."""
import io
import os
import re

import config
from errors import AppError

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MIN_TEXT_CHARS = 50
MAX_PDF_PAGES = 15


def parse_resume(filename: str, data: bytes) -> str:
    ext = os.path.splitext((filename or "").lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise AppError("unsupported_file_type", "Please upload a PDF or DOCX file.", 415)
    if not data:
        raise AppError("empty_file", "The uploaded file is empty.", 400)
    if len(data) > config.MAX_UPLOAD_BYTES:
        raise AppError(
            "file_too_large", f"The file is larger than {config.MAX_UPLOAD_MB} MB.", 413
        )

    # Check the real file signature, not just the name.
    if ext == ".pdf":
        if not data.startswith(b"%PDF"):
            raise AppError("invalid_file", "This does not look like a valid PDF.", 422)
        text = _read_pdf(data)
    else:
        if not data.startswith(b"PK"):
            raise AppError("invalid_file", "This does not look like a valid DOCX.", 422)
        text = _read_docx(data)

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) < MIN_TEXT_CHARS:
        raise AppError(
            "no_text",
            "We could not read text from this file. If it is a scan, upload a text-based PDF or DOCX.",
            422,
        )
    return text


def _read_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise AppError("encrypted_file", "Password-protected PDFs are not supported.", 422)
        pages = reader.pages[:MAX_PDF_PAGES]
        return "\n".join((p.extract_text() or "") for p in pages)
    except AppError:
        raise
    except Exception as e:  # noqa: BLE001
        raise AppError("invalid_file", "We could not read this PDF.", 422) from e


def _read_docx(data: bytes) -> str:
    from docx import Document

    try:
        doc = Document(io.BytesIO(data))
        parts = [p.text for p in doc.paragraphs]
        for table in doc.tables:
            for row in table.rows:
                parts.append(" | ".join(cell.text for cell in row.cells))
        return "\n".join(parts)
    except Exception as e:  # noqa: BLE001
        raise AppError("invalid_file", "We could not read this DOCX.", 422) from e
