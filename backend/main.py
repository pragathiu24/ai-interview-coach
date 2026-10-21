"""AI Interview Coach - FastAPI backend (Gemma 4)."""
import logging

from fastapi import FastAPI, File, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

import config
import prompts
from errors import AppError
from llm.client import LLMClient
from schemas import (
    CompareLLM,
    CompareRequest,
    CompareResponse,
    EvaluateRequest,
    EvaluateResponse,
    Evaluation,
    FollowupRequest,
    FollowupResponse,
    GeneratedQuestions,
    Question,
    QuestionsRequest,
    QuestionsResponse,
    ResumeAnalysis,
    ScoreDeltas,
    Scores,
)
from services.resume_parser import parse_resume

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("api")

app = FastAPI(title="AI Interview Coach API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = LLMClient()


# ---------- consistent error format: {"error": {"code", "message"}} ----------
def _err(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@app.exception_handler(AppError)
async def app_error_handler(request, exc: AppError):
    return _err(exc.status_code, exc.code, exc.message)


@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    first = errors[0] if errors else {}
    loc = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    where = f" at '{loc}'" if loc else ""
    return _err(422, "validation_error", f"Invalid input{where}: {first.get('msg', 'bad value')}")


@app.exception_handler(StarletteHTTPException)
async def http_handler(request, exc: StarletteHTTPException):
    return _err(exc.status_code, "http_error", str(exc.detail))


@app.exception_handler(Exception)
async def unhandled_handler(request, exc: Exception):
    log.exception("Unhandled error")  # stack trace stays in the server log only
    return _err(500, "internal_error", "Something went wrong on our side.")


def _mean(*values: int) -> float:
    return round(sum(values) / len(values), 1)


# ---------- routes (plain `def` so FastAPI runs them in a worker thread) ----------
@app.get("/health")
def health():
    return {"status": "ok", "provider": config.LLM_PROVIDER, "model": config.OLLAMA_MODEL}


@app.post("/api/resume/analyze", response_model=ResumeAnalysis)
def analyze_resume(file: UploadFile = File(...)):
    data = file.file.read(config.MAX_UPLOAD_BYTES + 1)
    text = parse_resume(file.filename or "", data)
    system, user = prompts.resume_analysis(text)
    return llm.generate_json(system, user, ResumeAnalysis, temperature=0.2)


@app.post("/api/interview/questions", response_model=QuestionsResponse)
def generate_questions(req: QuestionsRequest):
    system, user = prompts.questions(req.analysis, req.role, req.difficulty, req.count)
    result = llm.generate_json(system, user, GeneratedQuestions, temperature=0.7)
    items = result.questions[: req.count]
    return QuestionsResponse(
        questions=[Question(id=f"q{i + 1}", **q.model_dump()) for i, q in enumerate(items)]
    )


@app.post("/api/interview/followup", response_model=FollowupResponse)
def followup(req: FollowupRequest):
    system, user = prompts.followup(req.question, req.answer, req.evaluation)
    return llm.generate_json(system, user, FollowupResponse, temperature=0.5)


@app.post("/api/interview/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest):
    system, user = prompts.evaluate(req.question, req.answer, req.related_claim, req.analysis)
    ev = llm.generate_json(system, user, Evaluation, temperature=0.2)
    data = ev.model_dump()
    # Small models under-use this flag, so also enforce it from the scores.
    data["needs_followup"] = ev.needs_followup or min(
        ev.specificity.score, ev.technical_accuracy.score
    ) <= 5
    data["overall_score"] = _mean(
        ev.technical_accuracy.score,
        ev.specificity.score,
        ev.clarity.score,
        ev.resume_claim_support.score,
    )
    return EvaluateResponse(**data)


@app.post("/api/interview/compare", response_model=CompareResponse)
def compare(req: CompareRequest):
    system, user = prompts.compare(
        req.question, req.first_answer, req.retry_answer, req.related_claim, req.analysis
    )
    r = llm.generate_json(system, user, CompareLLM, temperature=0.2)
    a, b = r.first_scores, r.retry_scores
    deltas = ScoreDeltas(
        technical_accuracy=b.technical_accuracy - a.technical_accuracy,
        specificity=b.specificity - a.specificity,
        clarity=b.clarity - a.clarity,
        resume_claim_support=b.resume_claim_support - a.resume_claim_support,
    )
    first = _mean(a.technical_accuracy, a.specificity, a.clarity, a.resume_claim_support)
    retry = _mean(b.technical_accuracy, b.specificity, b.clarity, b.resume_claim_support)
    return CompareResponse(
        **r.model_dump(),
        deltas=deltas,
        overall_first=first,
        overall_retry=retry,
        overall_delta=round(retry - first, 1),
    )
