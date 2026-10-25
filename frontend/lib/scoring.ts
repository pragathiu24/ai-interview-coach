import { SCORE_KEYS } from "@/types/api";
import type { EvaluateResponse, ScoreKey, Scores } from "@/types/api";
import type { Session } from "@/types/session";

export type Band = "good" | "ok" | "low";

export function band(score: number): Band {
  if (score >= 8) return "good";
  if (score >= 5) return "ok";
  return "low";
}

export const BAND_TEXT: Record<Band, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  ok: "text-amber-600 dark:text-amber-400",
  low: "text-rose-600 dark:text-rose-400",
};

export const BAND_BG: Record<Band, string> = {
  good: "bg-emerald-500",
  ok: "bg-amber-500",
  low: "bg-rose-500",
};

export const BAND_LABEL: Record<Band, string> = {
  good: "Strong",
  ok: "Fair",
  low: "Needs work",
};

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatDelta(n: number): string {
  const text = Number.isInteger(n) ? String(Math.abs(n)) : Math.abs(n).toFixed(1);
  if (n > 0) return `+${text}`;
  if (n < 0) return `-${text}`;
  return "0";
}

export function answeredEvaluations(session: Session): EvaluateResponse[] {
  return session.questions.flatMap((q) => {
    const record = session.answers[q.id];
    return record ? [record.evaluation] : [];
  });
}

export function overallOf(session: Session): number | null {
  const evaluations = answeredEvaluations(session);
  if (evaluations.length === 0) return null;
  const total = evaluations.reduce((sum, e) => sum + e.overall_score, 0);
  return round1(total / evaluations.length);
}

export function dimensionAverages(session: Session): Scores | null {
  const evaluations = answeredEvaluations(session);
  if (evaluations.length === 0) return null;
  const result = {} as Scores;
  for (const key of SCORE_KEYS) {
    const total = evaluations.reduce((sum, e) => sum + e[key].score, 0);
    result[key] = round1(total / evaluations.length);
  }
  return result;
}

export function averageScores(list: Scores[]): Scores | null {
  if (list.length === 0) return null;
  const result = {} as Scores;
  for (const key of SCORE_KEYS) {
    result[key] = round1(list.reduce((sum, s) => sum + s[key], 0) / list.length);
  }
  return result;
}

export function weakestKey(scores: Scores): ScoreKey {
  return SCORE_KEYS.reduce((weakest, key) => (scores[key] < scores[weakest] ? key : weakest));
}

export const SCORE_TIPS: Record<ScoreKey, string> = {
  technical_accuracy: "Review the fundamentals behind your projects and double-check facts before answering.",
  specificity: "Add tools, numbers and real examples to every answer.",
  clarity: "Use a simple structure: situation, action, result.",
  resume_claim_support: "Prepare evidence for each resume claim: how you measured it and what you personally did.",
};
