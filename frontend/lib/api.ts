import { AI_TIMEOUT_MS, API_URL, MOCK_ERRORS, USE_MOCKS } from "./config";
import { mockAnalysis, mockCompare, mockEvaluate, mockFollowup, mockQuestions } from "./mocks";
import type {
  CompareRequest,
  CompareResponse,
  EvaluateRequest,
  EvaluateResponse,
  FollowupRequest,
  FollowupResponse,
  QuestionsRequest,
  QuestionsResponse,
  ResumeAnalysis,
} from "@/types/api";

/** Backend errors look like { "error": { "code": "...", "message": "..." } }. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } };
    if (body.error?.message) {
      return new ApiError(body.error.code ?? "http_error", body.error.message, res.status);
    }
  } catch {
    // The body was not JSON; fall through to the generic message.
  }
  return new ApiError("http_error", `The server returned an error (${res.status}).`, res.status);
}

const NETWORK_MESSAGE =
  "Cannot reach the server. Check that the backend is running, then try again.";

/** fetch with a timeout, one automatic retry on network failure, and typed errors. */
async function request<T>(path: string, init: RequestInit, timeoutMs = AI_TIMEOUT_MS): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
      if (!res.ok) throw await toApiError(res);
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new ApiError("timeout", "The AI took too long to respond. Please try again.");
      }
      if (attempt === 1) throw new ApiError("network_error", NETWORK_MESSAGE);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new ApiError("network_error", NETWORK_MESSAGE);
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function mockDelay(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 600 + Math.random() * 900));
  if (MOCK_ERRORS && Math.random() < 0.2) {
    throw new ApiError("mock_error", "Simulated error (NEXT_PUBLIC_MOCK_ERRORS is on).", 500);
  }
}

// ---------- the five endpoints ----------
export async function analyzeResume(file: File): Promise<ResumeAnalysis> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockAnalysis;
  }
  const form = new FormData();
  form.append("file", file);
  return request<ResumeAnalysis>("/api/resume/analyze", { method: "POST", body: form });
}

export async function generateQuestions(req: QuestionsRequest): Promise<QuestionsResponse> {
  if (USE_MOCKS) {
    await mockDelay();
    return { questions: mockQuestions.slice(0, req.count) };
  }
  return postJson<QuestionsResponse>("/api/interview/questions", req);
}

export async function evaluateAnswer(req: EvaluateRequest): Promise<EvaluateResponse> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockEvaluate(req.answer);
  }
  return postJson<EvaluateResponse>("/api/interview/evaluate", req);
}

export async function followUp(req: FollowupRequest): Promise<FollowupResponse> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockFollowup;
  }
  return postJson<FollowupResponse>("/api/interview/followup", req);
}

export async function compareAnswers(req: CompareRequest): Promise<CompareResponse> {
  if (USE_MOCKS) {
    await mockDelay();
    return mockCompare;
  }
  return postJson<CompareResponse>("/api/interview/compare", req);
}
