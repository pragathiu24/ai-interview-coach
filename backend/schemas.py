"""Request and response shapes. These ARE the API contract for the frontend."""
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


def _to_score(v):
    """Small models sometimes return 7.5, '8' or 11. Clean that up."""
    try:
        n = int(round(float(v)))
    except (TypeError, ValueError):
        raise ValueError("score must be a number between 0 and 10")
    return max(0, min(10, n))


# ---------- 1. Resume analysis ----------
class Project(BaseModel):
    name: str
    description: str
    technologies: List[str]


class ResumeAnalysis(BaseModel):
    candidate_name: str
    skills: List[str]
    projects: List[Project]
    experience_summary: str
    claims_to_verify: List[str]


# ---------- 2. Questions ----------
class QuestionsRequest(BaseModel):
    analysis: ResumeAnalysis
    role: str = Field(min_length=2, max_length=100)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    count: int = Field(default=5, ge=1, le=10)


class GeneratedQuestion(BaseModel):
    text: str
    type: Literal["technical", "behavioral", "resume"]
    related_claim: Optional[str] = None

    @field_validator("type", mode="before")
    @classmethod
    def _lower(cls, v):
        return v.strip().lower() if isinstance(v, str) else v


class GeneratedQuestions(BaseModel):
    questions: List[GeneratedQuestion]


class Question(GeneratedQuestion):
    id: str


class QuestionsResponse(BaseModel):
    questions: List[Question]


# ---------- 4. Evaluation ----------
class ScoreItem(BaseModel):
    score: int
    reason: str

    @field_validator("score", mode="before")
    @classmethod
    def _clamp(cls, v):
        return _to_score(v)


class Evaluation(BaseModel):
    technical_accuracy: ScoreItem
    specificity: ScoreItem
    clarity: ScoreItem
    resume_claim_support: ScoreItem
    missing_points: List[str]
    stronger_answer: str
    needs_followup: bool


class EvaluateRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    answer: str = Field(min_length=1, max_length=4000)
    related_claim: Optional[str] = Field(default=None, max_length=500)
    analysis: Optional[ResumeAnalysis] = None


class EvaluateResponse(Evaluation):
    overall_score: float


# ---------- 3. Follow-up ----------
class FollowupRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    answer: str = Field(min_length=1, max_length=4000)
    evaluation: Optional[Evaluation] = None


class FollowupResponse(BaseModel):
    followup_question: str
    reason: str


# ---------- 5. Retry comparison ----------
class Scores(BaseModel):
    technical_accuracy: int
    specificity: int
    clarity: int
    resume_claim_support: int

    @field_validator(
        "technical_accuracy", "specificity", "clarity", "resume_claim_support",
        mode="before",
    )
    @classmethod
    def _clamp(cls, v):
        return _to_score(v)


class ScoreDeltas(BaseModel):
    technical_accuracy: int
    specificity: int
    clarity: int
    resume_claim_support: int


class CompareRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    first_answer: str = Field(min_length=1, max_length=4000)
    retry_answer: str = Field(min_length=1, max_length=4000)
    related_claim: Optional[str] = Field(default=None, max_length=500)
    analysis: Optional[ResumeAnalysis] = None


class CompareLLM(BaseModel):
    first_scores: Scores
    retry_scores: Scores
    newly_covered_points: List[str]
    still_missing: List[str]
    summary: str


class CompareResponse(CompareLLM):
    deltas: ScoreDeltas
    overall_first: float
    overall_retry: float
    overall_delta: float
