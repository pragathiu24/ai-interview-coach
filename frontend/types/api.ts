// Shapes match the FastAPI backend (backend/schemas.py) exactly.

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "technical" | "behavioral" | "resume";

// ---------- 1. Resume analysis ----------
export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface ResumeAnalysis {
  candidate_name: string;
  skills: string[];
  projects: Project[];
  experience_summary: string;
  claims_to_verify: string[];
}

// ---------- 2. Questions ----------
export interface QuestionsRequest {
  analysis: ResumeAnalysis;
  role: string;
  difficulty: Difficulty;
  count: number;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  related_claim: string | null;
}

export interface QuestionsResponse {
  questions: Question[];
}

// ---------- 4. Evaluation ----------
export const SCORE_KEYS = [
  "technical_accuracy",
  "specificity",
  "clarity",
  "resume_claim_support",
] as const;

export type ScoreKey = (typeof SCORE_KEYS)[number];

export const SCORE_LABELS: Record<ScoreKey, string> = {
  technical_accuracy: "Technical accuracy",
  specificity: "Specificity",
  clarity: "Clarity",
  resume_claim_support: "Resume-claim support",
};

export interface ScoreItem {
  score: number; // integer 0-10
  reason: string;
}

export interface Evaluation {
  technical_accuracy: ScoreItem;
  specificity: ScoreItem;
  clarity: ScoreItem;
  resume_claim_support: ScoreItem;
  missing_points: string[];
  stronger_answer: string;
  needs_followup: boolean;
}

export interface EvaluateRequest {
  question: string;
  answer: string;
  related_claim?: string | null;
  analysis?: ResumeAnalysis | null;
}

export interface EvaluateResponse extends Evaluation {
  overall_score: number; // 0-10, one decimal
}

// ---------- 3. Follow-up ----------
export interface FollowupRequest {
  question: string;
  answer: string;
  evaluation?: Evaluation | null;
}

export interface FollowupResponse {
  followup_question: string;
  reason: string;
}

// ---------- 5. Retry comparison ----------
export type Scores = Record<ScoreKey, number>;

export interface CompareRequest {
  question: string;
  first_answer: string;
  retry_answer: string;
  related_claim?: string | null;
  analysis?: ResumeAnalysis | null;
}

export interface CompareResponse {
  first_scores: Scores;
  retry_scores: Scores;
  deltas: Scores; // retry minus first, can be negative
  overall_first: number;
  overall_retry: number;
  overall_delta: number;
  newly_covered_points: string[];
  still_missing: string[];
  summary: string;
}
