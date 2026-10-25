"use client";

import Link from "next/link";
import Thinking from "@/components/Thinking";
import TrendChart from "@/components/TrendChart";
import { USE_MOCKS } from "@/lib/config";
import { buildDemoSessions } from "@/lib/demo";
import {
  BAND_LABEL,
  BAND_TEXT,
  SCORE_TIPS,
  averageScores,
  band,
  dimensionAverages,
  overallOf,
  round1,
  weakestKey,
} from "@/lib/scoring";
import { btnPrimary, btnSecondary, cardCls } from "@/lib/ui";
import { useHydrated } from "@/lib/useHydrated";
import { useSessions } from "@/store/sessions";
import { SCORE_LABELS } from "@/types/api";
import type { Scores } from "@/types/api";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const hydrated = useHydrated();
  const sessionsMap = useSessions((s) => s.sessions);
  const loadDemo = useSessions((s) => s.loadDemo);
  const deleteSession = useSessions((s) => s.deleteSession);

  if (!hydrated) return <Thinking title="Loading your sessions" />;

  const all = Object.values(sessionsMap).sort((a, b) => b.createdAt - a.createdAt);
  const scored = all
    .filter((s) => s.completed && overallOf(s) !== null)
    .sort((a, b) => a.createdAt - b.createdAt);

  const overalls = scored.map((s) => overallOf(s) ?? 0);
  const average = overalls.length ? round1(overalls.reduce((sum, n) => sum + n, 0) / overalls.length) : null;
  const best = overalls.length ? Math.max(...overalls) : null;

  const dimensionList = scored
    .map((s) => dimensionAverages(s))
    .filter((d): d is Scores => d !== null);
  const dimensions = averageScores(dimensionList);
  const weakest = dimensions ? weakestKey(dimensions) : null;

  const trend = scored.map((s, i) => ({ label: `#${i + 1}`, score: overallOf(s) ?? 0 }));

  function remove(id: string) {
    if (window.confirm("Delete this session from your device?")) deleteSession(id);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Your dashboard</h1>
          <p className="mt-1 text-muted">Sessions are saved on this device only.</p>
        </div>
        <Link href="/resume" className={btnPrimary}>
          New interview
        </Link>
      </div>

      {all.length === 0 ? (
        <div className={`${cardCls} mx-auto max-w-xl text-center`}>
          <h2 className="text-xl font-semibold">No interviews yet</h2>
          <p className="mt-2 text-sm text-muted">
            Upload your resume and complete a mock interview to see your scores and progress here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/resume" className={btnPrimary}>
              Start your first interview
            </Link>
            {USE_MOCKS ? (
              <button type="button" className={btnSecondary} onClick={() => loadDemo(buildDemoSessions())}>
                Load sample sessions
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={cardCls}>
              <p className="text-sm text-muted">Completed interviews</p>
              <p className="mt-1 text-3xl font-semibold">{scored.length}</p>
            </div>
            <div className={cardCls}>
              <p className="text-sm text-muted">Average score</p>
              <p className="mt-1 text-3xl font-semibold">{average !== null ? `${average}/10` : "-"}</p>
            </div>
            <div className={cardCls}>
              <p className="text-sm text-muted">Best score</p>
              <p className="mt-1 text-3xl font-semibold">{best !== null ? `${best}/10` : "-"}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className={`${cardCls} lg:col-span-2`} aria-labelledby="trend">
              <h2 id="trend" className="font-semibold">
                Score trend
              </h2>
              {trend.length >= 2 ? (
                <TrendChart data={trend} />
              ) : (
                <p className="mt-3 text-sm text-muted">Complete one more interview to see your trend.</p>
              )}
            </section>

            <section className={cardCls} aria-labelledby="weakest">
              <h2 id="weakest" className="font-semibold">
                Weakest skill
              </h2>
              {weakest && dimensions ? (
                <>
                  <p className="mt-3 text-xl font-semibold">{SCORE_LABELS[weakest]}</p>
                  <p className={`text-sm font-medium ${BAND_TEXT[band(dimensions[weakest])]}`}>
                    {dimensions[weakest]}/10 on average
                  </p>
                  <p className="mt-3 text-sm text-muted">{SCORE_TIPS[weakest]}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">Finish an interview to see where to focus.</p>
              )}
            </section>
          </div>

          <section aria-labelledby="past">
            <h2 id="past" className="mb-3 text-xl font-semibold">
              Past sessions
            </h2>
            <ul className="space-y-3">
              {all.map((s) => {
                const overall = overallOf(s);
                return (
                  <li key={s.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-4 p-4`}>
                    <div>
                      <p className="font-medium">{s.role}</p>
                      <p className="text-sm text-muted">
                        {formatDate(s.createdAt)} · {s.difficulty} · {s.questions.length} questions
                        {s.completed ? "" : " · in progress"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {overall !== null ? (
                        <p className={`text-lg font-semibold ${BAND_TEXT[band(overall)]}`}>
                          {overall}/10 <span className="text-xs font-normal text-muted">{BAND_LABEL[band(overall)]}</span>
                        </p>
                      ) : null}
                      <Link
                        href={s.completed ? `/feedback/${s.id}` : `/interview/${s.id}`}
                        className={btnSecondary}
                      >
                        {s.completed ? "View feedback" : "Continue"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(s.id)}
                        className="text-sm text-muted underline hover:text-foreground"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
