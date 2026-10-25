import type {
  CompareResponse,
  Difficulty,
  EvaluateResponse,
  Question,
  ResumeAnalysis,
} from "./api";

export interface SessionQuestion extends Question {
  isFollowup?: boolean;
  parentId?: string;
}

export interface AnswerRecord {
  text: string;
  evaluation: EvaluateResponse;
}

export interface RetryRecord {
  retryAnswer: string;
  result: CompareResponse;
}

export interface Session {
  id: string;
  createdAt: number;
  role: string;
  difficulty: Difficulty;
  analysis: ResumeAnalysis;
  questions: SessionQuestion[];
  currentIndex: number;
  answers: Record<string, AnswerRecord>;
  retries: Record<string, RetryRecord>;
  completed: boolean;
}
