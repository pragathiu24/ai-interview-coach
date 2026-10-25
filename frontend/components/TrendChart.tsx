"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface TrendPoint {
  label: string;
  score: number;
}

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full text-muted" role="img" aria-label="Line chart of the overall score for each session">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.2} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} stroke="currentColor" />
          <YAxis domain={[0, 10]} tick={{ fill: "currentColor", fontSize: 12 }} stroke="currentColor" />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
