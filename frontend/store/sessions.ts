import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CompareResponse,
  Difficulty,
  EvaluateResponse,
  FollowupResponse,
  Question,
  ResumeAnalysis,
} from "@/types/api";
import type { Session, SessionQuestion } from "@/types/session";

interface CreateInput {
  role: string;
  difficulty: Difficulty;
  analysis: ResumeAnalysis;
  questions: Question[];
}

interface SessionsState {
  sessions: Record<string, Session>;
  createSession: (input: CreateInput) => string;
  saveAnswer: (sessionId: string, questionId: string, text: string, evaluation: EvaluateResponse) => void;
  insertFollowup: (sessionId: string, afterQuestionId: string, followup: FollowupResponse) => void;
  /** Moves to the next question. Returns true when the interview is finished. */
  advance: (sessionId: string) => boolean;
  saveRetry: (sessionId: string, questionId: string, retryAnswer: string, result: CompareResponse) => void;
  deleteSession: (sessionId: string) => void;
  loadDemo: (sessions: Session[]) => void;
}

function newId(): string {
  return `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const useSessions = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: {},

      createSession: ({ role, difficulty, analysis, questions }) => {
        const id = newId();
        const session: Session = {
          id,
          createdAt: Date.now(),
          role,
          difficulty,
          analysis,
          questions,
          currentIndex: 0,
          answers: {},
          retries: {},
          completed: false,
        };
        set((state) => ({ sessions: { ...state.sessions, [id]: session } }));
        return id;
      },

      saveAnswer: (sessionId, questionId, text, evaluation) =>
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                answers: { ...session.answers, [questionId]: { text, evaluation } },
              },
            },
          };
        }),

      insertFollowup: (sessionId, afterQuestionId, followup) =>
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          const index = session.questions.findIndex((q) => q.id === afterQuestionId);
          const followupId = `${afterQuestionId}-f`;
          if (index === -1 || session.questions.some((q) => q.id === followupId)) return state;
          const parent = session.questions[index];
          const inserted: SessionQuestion = {
            id: followupId,
            text: followup.followup_question,
            type: parent.type,
            related_claim: parent.related_claim,
            isFollowup: true,
            parentId: afterQuestionId,
          };
          const questions = [...session.questions];
          questions.splice(index + 1, 0, inserted);
          return { sessions: { ...state.sessions, [sessionId]: { ...session, questions } } };
        }),

      advance: (sessionId) => {
        const session = get().sessions[sessionId];
        if (!session) return true;
        const finished = session.currentIndex + 1 >= session.questions.length;
        set((state) => {
          const current = state.sessions[sessionId];
          if (!current) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...current,
                currentIndex: finished ? current.currentIndex : current.currentIndex + 1,
                completed: finished ? true : current.completed,
              },
            },
          };
        });
        return finished;
      },

      saveRetry: (sessionId, questionId, retryAnswer, result) =>
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                retries: { ...session.retries, [questionId]: { retryAnswer, result } },
              },
            },
          };
        }),

      deleteSession: (sessionId) =>
        set((state) => {
          const rest = { ...state.sessions };
          delete rest[sessionId];
          return { sessions: rest };
        }),

      loadDemo: (demo) =>
        set((state) => {
          const merged = { ...state.sessions };
          for (const session of demo) merged[session.id] = session;
          return { sessions: merged };
        }),
    }),
    {
      name: "interview-coach-sessions",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sessions: state.sessions }),
    },
  ),
);
