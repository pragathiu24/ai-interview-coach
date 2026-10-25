import { ApiError } from "@/lib/api";

const HINTS: Record<string, string> = {
  llm_unavailable: "Open the Ollama app on your computer, then try again.",
  model_not_found: "The AI model is not installed yet. Run ollama pull in Terminal.",
  network_error: "Start the backend with: uvicorn main:app --reload",
  timeout: "Local models can be slow. Try again, or raise LLM_TIMEOUT in backend/.env.",
  llm_timeout: "Local models can be slow. Try again, or raise LLM_TIMEOUT in backend/.env.",
  bad_model_output: "The model returned something unreadable. Trying again usually works.",
  file_too_large: "Choose a smaller file (5 MB maximum).",
  unsupported_file_type: "Upload a PDF or DOCX file.",
  no_text: "Export your resume as a text-based PDF or DOCX instead of a scan.",
};

export default function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  const hint = error instanceof ApiError ? HINTS[error.code] : undefined;

  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
    >
      <p className="font-medium">{message}</p>
      {hint ? <p className="mt-1 opacity-90">{hint}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-rose-400 px-3 py-1.5 font-medium hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-900"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
