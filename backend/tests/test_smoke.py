"""
End-to-end smoke test: needs the server AND Ollama running.

    cd backend && source venv/bin/activate
    uvicorn main:app --reload          # in another terminal
    pytest tests/test_smoke.py -s

Saves real request/response samples to /docs/samples/ (used for frontend types and mocks).
"""
import io
import json
import os
from pathlib import Path

import httpx
import pytest
from docx import Document

BASE_URL = os.getenv("API_URL", "http://127.0.0.1:8000")
SAMPLES = Path(__file__).resolve().parents[2] / "docs" / "samples"

VAGUE_ANSWER = "I used caching to make it faster and it worked well."
BETTER_ANSWER = (
    "I profiled the endpoint with py-spy and found that repeated Postgres queries dominated. "
    "I added a Redis cache with a 60 second TTL and invalidated keys on writes. "
    "Median latency dropped from about 800 ms to 480 ms, measured with Locust under the same load. "
    "The trade-off was slightly stale data for up to a minute."
)


def save_sample(name: str, request: dict, response: dict) -> None:
    SAMPLES.mkdir(parents=True, exist_ok=True)
    (SAMPLES / f"{name}.json").write_text(
        json.dumps({"request": request, "response": response}, indent=2)
    )


def make_resume_docx() -> bytes:
    d = Document()
    d.add_heading("Asha Rao", 0)
    d.add_paragraph("Backend Developer | Bengaluru | asha@example.com")
    d.add_heading("Experience", 1)
    d.add_paragraph(
        "Software Engineer, Acme Retail (2023-2025). Built REST APIs with Python, FastAPI "
        "and PostgreSQL. Reduced API latency by 40% by adding Redis caching. "
        "Led migration of 12 services to Docker and AWS ECS."
    )
    d.add_heading("Projects", 1)
    d.add_paragraph(
        "Order Tracker: real-time order tracking web app using FastAPI, React and WebSockets, "
        "used by 300 daily users."
    )
    d.add_heading("Skills", 1)
    d.add_paragraph("Python, FastAPI, PostgreSQL, Redis, Docker, AWS, React, Git")
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()


@pytest.fixture(scope="module")
def client():
    c = httpx.Client(base_url=BASE_URL, timeout=300)
    try:
        c.get("/health").raise_for_status()
    except Exception:
        pytest.skip(f"Server not running at {BASE_URL}. Start it with: uvicorn main:app --reload")
    yield c
    c.close()


@pytest.fixture(scope="module")
def analysis(client):
    files = {
        "file": (
            "sample_resume.docx",
            make_resume_docx(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    r = client.post("/api/resume/analyze", files=files)
    assert r.status_code == 200, r.text
    body = r.json()
    save_sample("1_resume_analyze", {"file": "sample_resume.docx"}, body)
    return body


@pytest.fixture(scope="module")
def questions(client, analysis):
    req = {"analysis": analysis, "role": "Backend Developer", "difficulty": "medium", "count": 4}
    r = client.post("/api/interview/questions", json=req)
    assert r.status_code == 200, r.text
    body = r.json()
    save_sample("2_interview_questions", req, body)
    return body["questions"]


@pytest.fixture(scope="module")
def evaluation(client, analysis, questions):
    req = {
        "question": questions[0]["text"],
        "answer": VAGUE_ANSWER,
        "related_claim": questions[0].get("related_claim"),
        "analysis": analysis,
    }
    r = client.post("/api/interview/evaluate", json=req)
    assert r.status_code == 200, r.text
    body = r.json()
    save_sample("4_interview_evaluate", req, body)
    return body


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_resume_analysis_shape(analysis):
    assert analysis["skills"], "no skills extracted"
    assert isinstance(analysis["projects"], list)
    assert isinstance(analysis["claims_to_verify"], list)


def test_questions_shape(questions):
    assert 1 <= len(questions) <= 4
    for q in questions:
        assert q["id"].startswith("q")
        assert q["text"].strip()
        assert q["type"] in {"technical", "behavioral", "resume"}


def test_evaluation_shape(evaluation):
    for key in ("technical_accuracy", "specificity", "clarity", "resume_claim_support"):
        assert 0 <= evaluation[key]["score"] <= 10
        assert evaluation[key]["reason"]
    assert 0 <= evaluation["overall_score"] <= 10
    assert isinstance(evaluation["missing_points"], list)
    assert evaluation["stronger_answer"]
    assert isinstance(evaluation["needs_followup"], bool)


def test_followup(client, questions, evaluation):
    req = {"question": questions[0]["text"], "answer": VAGUE_ANSWER, "evaluation": evaluation}
    r = client.post("/api/interview/followup", json=req)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["followup_question"].strip()
    save_sample("3_interview_followup", {**req, "evaluation": "(see 4_interview_evaluate)"}, body)


def test_compare(client, analysis, questions):
    req = {
        "question": questions[0]["text"],
        "first_answer": VAGUE_ANSWER,
        "retry_answer": BETTER_ANSWER,
        "related_claim": questions[0].get("related_claim"),
        "analysis": analysis,
    }
    r = client.post("/api/interview/compare", json=req)
    assert r.status_code == 200, r.text
    body = r.json()
    assert set(body["deltas"]) == {"technical_accuracy", "specificity", "clarity", "resume_claim_support"}
    assert body["summary"].strip()
    save_sample("5_interview_compare", req, body)


def test_bad_upload_uses_error_format(client):
    r = client.post("/api/resume/analyze", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert r.status_code == 415
    assert r.json()["error"]["code"] == "unsupported_file_type"


def test_validation_error_uses_error_format(client):
    r = client.post("/api/interview/evaluate", json={"question": "x"})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"
