// NEXT_PUBLIC_* values are read at build/start time. Restart `npm run dev` after changing .env.local.
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
export const MOCK_ERRORS = process.env.NEXT_PUBLIC_MOCK_ERRORS === "true";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// The local Gemma model can take 1-2 minutes per call.
export const AI_TIMEOUT_MS = 280_000;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_ANSWER_CHARS = 4000;
