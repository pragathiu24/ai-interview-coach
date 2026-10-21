export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType = "resume" | "technical" | "behavioral";

export type Project = {
  name: string;
  description: string;
  technologies: string[];
};

export type ResumeAnalysis = {
  candidate_name: string;
  skills: string[];
  projects: Project[];
  experience_summary: string;
  claims_to_verify: string[];
};

export type Question = {
  text: string;
  type: QuestionType;
  related_claim: string | null;
  id: string;
};

export type QuestionsResponse = {
  questions: Question[];
};

export type ScoreItem = {
  score: number;
  reason: string;
};

export type Evaluation = {
  technical_accuracy: ScoreItem;
  specificity: ScoreItem;
  clarity: ScoreItem;
  resume_claim_support: ScoreItem;
  missing_points: string[];
  stronger_answer: string;
  needs_followup: boolean;
};

export type EvaluateResponse = Evaluation & {
  overall_score: number;
};

export type FollowupResponse = {
  followup_question: string;
  reason: string;
};

export type ScoreBreakdown = {
  technical_accuracy: number;
  specificity: number;
  clarity: number;
  resume_claim_support: number;
};

export type ScoreDeltas = ScoreBreakdown;

export type CompareResponse = {
  first_scores: ScoreBreakdown;
  retry_scores: ScoreBreakdown;
  newly_covered_points: string[];
  still_missing: string[];
  summary: string;
  deltas: ScoreDeltas;
  overall_first: number;
  overall_retry: number;
  overall_delta: number;
};

export type QuestionsRequest = {
  analysis: ResumeAnalysis;
  role: string;
  difficulty: Difficulty;
  count: number;
};

export type FollowupRequest = {
  question: string;
  answer: string;
  evaluation?: Evaluation;
};

export type EvaluateRequest = {
  question: string;
  answer: string;
  related_claim?: string | null;
  analysis?: ResumeAnalysis;
};

export type CompareRequest = {
  question: string;
  first_answer: string;
  retry_answer: string;
  related_claim?: string | null;
  analysis?: ResumeAnalysis;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}
