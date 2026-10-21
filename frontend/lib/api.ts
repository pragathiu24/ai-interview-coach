import {
  mockCompare,
  mockEvaluationForAnswer,
  mockFollowup,
  mockQuestionsResponse,
  mockResumeAnalysis,
} from "@/lib/mocks";
import {
  ApiError,
  type ApiErrorBody,
  type CompareRequest,
  type CompareResponse,
  type EvaluateRequest,
  type EvaluateResponse,
  type FollowupRequest,
  type FollowupResponse,
  type QuestionsRequest,
  type QuestionsResponse,
  type ResumeAnalysis,
} from "@/types/api";

const AI_TIMEOUT_MS = 280_000;
const MOCK_DELAY_MIN_MS = 600;
const MOCK_DELAY_MAX_MS = 1500;
const MOCK_ERROR_RATE = 0.1;

function mocksEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}

function apiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return base.replace(/\/+$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomDelayMs(): number {
  return (
    MOCK_DELAY_MIN_MS +
    Math.floor(Math.random() * (MOCK_DELAY_MAX_MS - MOCK_DELAY_MIN_MS + 1))
  );
}

async function withMockDelay<T>(value: T): Promise<T> {
  await sleep(randomDelayMs());
  if (Math.random() < MOCK_ERROR_RATE) {
    throw new ApiError(
      "mock_error",
      "The mock API failed this request. Try again.",
      503,
    );
  }
  return value;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("error" in value)) {
    return false;
  }
  const error = value.error;
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return (
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}

async function request<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      if (isApiErrorBody(parsed)) {
        throw new ApiError(
          parsed.error.code,
          parsed.error.message,
          response.status,
        );
      }
      throw new ApiError(
        "http_error",
        text || `Request failed with status ${response.status}`,
        response.status,
      );
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        "timeout",
        "The AI request timed out after 280 seconds.",
        408,
      );
    }
    throw new ApiError(
      "network_error",
      error instanceof Error ? error.message : "Network request failed",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function analyzeResume(file: File): Promise<ResumeAnalysis> {
  if (mocksEnabled()) {
    return withMockDelay(mockResumeAnalysis);
  }

  const form = new FormData();
  form.append("file", file);

  return request<ResumeAnalysis>("/api/resume/analyze", {
    method: "POST",
    body: form,
  });
}

export async function generateQuestions(
  body: QuestionsRequest,
): Promise<QuestionsResponse> {
  if (mocksEnabled()) {
    return withMockDelay(mockQuestionsResponse(body));
  }
  return request<QuestionsResponse>("/api/interview/questions", jsonInit(body));
}

export async function getFollowup(
  body: FollowupRequest,
): Promise<FollowupResponse> {
  if (mocksEnabled()) {
    return withMockDelay(mockFollowup);
  }
  return request<FollowupResponse>("/api/interview/followup", jsonInit(body));
}

export async function evaluateAnswer(
  body: EvaluateRequest,
): Promise<EvaluateResponse> {
  if (mocksEnabled()) {
    return withMockDelay(mockEvaluationForAnswer(body));
  }
  return request<EvaluateResponse>("/api/interview/evaluate", jsonInit(body));
}

export async function compareAnswers(
  body: CompareRequest,
): Promise<CompareResponse> {
  if (mocksEnabled()) {
    return withMockDelay(mockCompare);
  }
  return request<CompareResponse>("/api/interview/compare", jsonInit(body));
}
