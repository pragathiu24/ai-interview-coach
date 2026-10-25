import { formatDelta } from "@/lib/scoring";

export default function DeltaBadge({ value }: { value: number }) {
  const up = value > 0;
  const down = value < 0;
  const color = up
    ? "text-emerald-600 dark:text-emerald-400"
    : down
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted";
  const arrow = up ? "▲" : down ? "▼" : "–";
  const meaning = up ? "improved" : down ? "declined" : "no change";

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${color}`}>
      <span aria-hidden="true">{arrow}</span>
      <span>{formatDelta(value)}</span>
      <span className="sr-only">{meaning}</span>
    </span>
  );
}
