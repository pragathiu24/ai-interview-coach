"""Fast tests that need NO model and NO running server."""
import io

import pytest
from docx import Document

from errors import AppError
from llm.jsonutil import extract_json
from schemas import Evaluation, ScoreItem
from services.resume_parser import parse_resume


def _docx(text: str) -> bytes:
    d = Document()
    d.add_paragraph(text)
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()


def test_extract_json_plain():
    assert extract_json('{"a": 1}') == {"a": 1}


def test_extract_json_fenced_and_chatty():
    raw = 'Sure! Here it is:\n```json\n{"a": 2}\n```\nHope that helps.'
    assert extract_json(raw) == {"a": 2}


def test_extract_json_embedded():
    assert extract_json('Result: {"a": 3} done') == {"a": 3}


def test_extract_json_rejects_garbage():
    with pytest.raises(ValueError):
        extract_json("no json here")


def test_score_is_clamped_and_rounded():
    assert ScoreItem(score=11, reason="x").score == 10
    assert ScoreItem(score="7.6", reason="x").score == 8
    assert ScoreItem(score=-3, reason="x").score == 0


def test_evaluation_requires_all_fields():
    with pytest.raises(Exception):
        Evaluation.model_validate({"clarity": {"score": 5, "reason": "x"}})


def test_parse_docx_ok():
    text = parse_resume("cv.docx", _docx("Asha Rao. Python developer with FastAPI and PostgreSQL experience."))
    assert "Asha Rao" in text


def test_parse_rejects_wrong_type():
    with pytest.raises(AppError) as e:
        parse_resume("cv.txt", b"hello")
    assert e.value.code == "unsupported_file_type"


def test_parse_rejects_fake_pdf():
    with pytest.raises(AppError) as e:
        parse_resume("cv.pdf", b"this is not a pdf")
    assert e.value.code == "invalid_file"


def test_parse_rejects_too_large():
    with pytest.raises(AppError) as e:
        parse_resume("cv.pdf", b"%PDF" + b"0" * (6 * 1024 * 1024))
    assert e.value.code == "file_too_large"


def test_parse_rejects_empty_text():
    with pytest.raises(AppError) as e:
        parse_resume("cv.docx", _docx("hi"))
    assert e.value.code == "no_text"
