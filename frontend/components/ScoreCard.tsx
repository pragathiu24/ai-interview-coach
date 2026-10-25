import { BAND_BG, BAND_TEXT, band } from "@/lib/scoring";
import { cardCls } from "@/lib/ui";
import type { ScoreItem } from "@/types/api";

export default function ScoreCard({ label, item }: { label: string; item: ScoreItem }) {
  const b = band(item.score);
  return (
    <div className={`${cardCls} p-4`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <p className={`text-2xl font-semibold ${BAND_TEXT[b]}`}>
          {item.score}
          <span className="text-sm font-normal text-muted">/10</span>
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-border" aria-hidden="true">
        <div className={`h-1.5 rounded-full ${BAND_BG[b]}`} style={{ width: `${item.score * 10}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">{item.reason}</p>
    </div>
  );
}
