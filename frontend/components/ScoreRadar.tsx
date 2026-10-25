"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { SCORE_KEYS, SCORE_LABELS } from "@/types/api";
import type { Scores } from "@/types/api";

export default function ScoreRadar({ scores }: { scores: Scores }) {
  const data = SCORE_KEYS.map((key) => ({ label: SCORE_LABELS[key], value: scores[key] }));
  const summary = data.map((d) => `${d.label} ${d.value} out of 10`).join(", ");

  return (
    <div className="h-72 w-full text-muted" role="img" aria-label={`Radar chart: ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="currentColor" strokeOpacity={0.3} />
          <PolarAngleAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="#0d9488" fill="#0d9488" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
