export type InterviewerState = "idle" | "speaking" | "listening" | "thinking";

const LABELS: Record<InterviewerState, string> = {
  idle: "Waiting for your answer",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Thinking",
};

/** Stand-in for the 3D avatar, which replaces this component in the avatar stage. */
export default function InterviewerPlaceholder({ state }: { state: InterviewerState }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-gradient-to-b from-accent-soft to-card p-6">
      <svg
        viewBox="0 0 120 140"
        className={`h-48 w-auto ${state === "thinking" ? "animate-pulse" : ""}`}
        role="img"
        aria-label="Interviewer avatar placeholder"
      >
        <circle cx="60" cy="48" r="28" className="fill-accent opacity-90" />
        <path d="M12 140c0-30 22-48 48-48s48 18 48 48z" className="fill-accent opacity-55" />
        <circle cx="50" cy="44" r="3.5" className="fill-white" />
        <circle cx="70" cy="44" r="3.5" className="fill-white" />
        <rect
          x="50"
          y="58"
          width="20"
          height="4"
          rx="2"
          className={`fill-white ${state === "speaking" ? "animate-pulse" : ""}`}
        />
      </svg>
      <p className="mt-3 text-sm font-medium" aria-live="polite">
        {LABELS[state]}
      </p>
      <p className="text-xs text-muted">The 3D interviewer arrives in the avatar stage</p>
    </div>
  );
}
