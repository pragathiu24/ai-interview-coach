import { mockAnalysis, mockCompare, mockEvaluations, mockQuestions, sampleAnswers } from "./mocks";
import type { Session } from "@/types/session";

type Level = "weak" | "medium" | "strong";

const DAY_MS = 24 * 60 * 60 * 1000;

function build(id: string, daysAgo: number, role: string, levels: Level[], withRetry: boolean): Session {
  const questions = mockQuestions.slice(0, levels.length);
  const answers: Session["answers"] = {};
  questions.forEach((q, i) => {
    answers[q.id] = { text: sampleAnswers[levels[i]], evaluation: mockEvaluations[levels[i]] };
  });
  return {
    id,
    createdAt: Date.now() - daysAgo * DAY_MS,
    role,
    difficulty: "medium",
    analysis: mockAnalysis,
    questions,
    currentIndex: questions.length - 1,
    answers,
    retries: withRetry
      ? { q1: { retryAnswer: sampleAnswers.strong, result: mockCompare } }
      : {},
    completed: true,
  };
}

/** Sample sessions for demo mode, so the dashboard has a trend to show. */
export function buildDemoSessions(): Session[] {
  return [
    build("demo_1", 21, "Backend Developer", ["weak", "weak", "medium", "weak", "medium"], false),
    build("demo_2", 14, "Backend Developer", ["weak", "medium", "medium", "weak", "medium"], false),
    build("demo_3", 7, "Backend Developer", ["medium", "medium", "strong", "medium", "medium"], false),
    build("demo_4", 2, "Backend Developer", ["medium", "strong", "strong", "medium", "strong"], true),
  ];
}
