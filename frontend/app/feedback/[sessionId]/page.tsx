"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DeltaBadge from "@/components/DeltaBadge";
import NotFoundCard from "@/components/NotFoundCard";
import ScoreCard from "@/components/ScoreCard";
import ScoreRadar from "@/components/ScoreRadar";
import Thinking from "@/components/Thinking";
import {
  BAND_BG,
  BAND_LABEL,
  BAND_TEXT,
  SCORE_TIPS,
  band,
  dimensionAverages,
  overallOf,
  weakestKey,
} from "@/lib/scoring";
import { btnPrimary, btnSecondary, cardCls } from "@/lib/ui";
import { useHydrated } from "@/lib/useHydrated";
import { useSessions } from "@/store/sessions";
import { SCORE_KEYS, SCORE_LABELS } from "@/types/api";
import type { Session, SessionQuestion } from "@/types/session";

function claimVerdict(score: number): { label: string; cls: string } {
  if (score >= 7) return { label: "Supported", cls: BAND_TEXT.good };
  if (score >= 4) return { label: "Partly supported", cls: BAND_TEXT.ok };
  return { label: "Not supported", cls: BAND_TEXT.low };
}

export default function FeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const hydrated = useHydrated();
  const session = useSessions((s) => s.sessions[sessionId]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  // Open every answer while printing, so the PDF report contains everything.
  useEffect(() => {
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  if (!hydrated) return <Thinking title="Loading your feedback" />;
  if (!session) {
    return <NotFoundCard title="Feedback not found" text="This session is not saved on this device." />;
  }

  const overall = overallOf(session);
  const averages = dimensionAverages(session);

  if (overall === null || averages === null) {
    return (
      <div className={`${cardCls} mx-auto max-w-xl text-center`}>
        <h1 className="text-xl font-semibold">No scored answers yet</h1>
        <p className="mt-2 text-sm text-muted">Answer at least one question to see your feedback.</p>
        <Link href={session.completed ? "/resume" : `/interview/${session.id}`} className={`${btnPrimary} mt-5`}>
          {session.completed ? "New interview" : "Continue interview"}
        </Link>
      </div>
    );
  }

  const overallBand = band(overall);
  const weakest = weakestKey(averages);
  const answeredCount = session.questions.filter((q) => session.answers[q.id]).length;

  return (
    <div className="space-y-8">
      <section className={`${cardCls} flex flex-wrap items-center justify-between gap-6`}>
        <div>
          <p className="text-sm text-muted">
            {session.role} · {session.difficulty} · {answeredCount} of {session.questions.length} questions answered
          </p>
          <h1 className="mt-1 text-3xl font-bold">Your interview feedback</h1>
          <p className="mt-2 text-sm text-muted">
            Focus next on <span className="font-medium text-foreground">{SCORE_LABELS[weakest]}</span>. {SCORE_TIPS[weakest]}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-5xl font-bold ${BAND_TEXT[overallBand]}`}>
            {overall}
            <span className="text-lg font-normal text-muted">/10</span>
          </p>
          <p className="text-sm font-medium">{BAND_LABEL[overallBand]}</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button type="button" className={btnSecondary} onClick={() => window.print()}>
            Download report
          </button>
          <Link href="/resume" className={btnPrimary}>
            New interview
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-labelledby="skills">
        <div className={cardCls}>
          <h2 id="skills" className="font-semibold">
            Skills overview
          </h2>
          <ScoreRadar scores={averages} />
        </div>
        <div className={cardCls}>
          <h2 className="font-semibold">Average by skill</h2>
          <ul className="mt-4 space-y-4">
            {SCORE_KEYS.map((key) => (
              <li key={key}>
                <div className="flex justify-between text-sm">
                  <span>{SCORE_LABELS[key]}</span>
                  <span className={`font-semibold ${BAND_TEXT[band(averages[key])]}`}>{averages[key]}/10</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-border" aria-hidden="true">
                  <div
                    className={`h-2 rounded-full ${BAND_BG[band(averages[key])]}`}
                    style={{ width: `${averages[key] * 10}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="by-question">
        <h2 id="by-question" className="mb-3 text-xl font-semibold">
          Question by question
        </h2>
        <ul className="space-y-3">
          {session.questions.map((question, index) => (
            <QuestionFeedback
              key={question.id}
              session={session}
              question={question}
              number={index + 1}
              open={printing || openId === question.id}
              onToggle={() => setOpenId(openId === question.id ? null : question.id)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function QuestionFeedback({
  session,
  question,
  number,
  open,
  onToggle,
}: {
  session: Session;
  question: SessionQuestion;
  number: number;
  open: boolean;
  onToggle: () => void;
}) {
  const record = session.answers[question.id];
  const retry = session.retries[question.id];
  const panelId = `panel-${question.id}`;

  return (
    <li className={`${cardCls} p-0`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span>
          <span className="block text-xs text-muted">
            {question.isFollowup ? "Follow-up" : `Question ${number}`} · {question.type}
          </span>
          <span className="block font-medium">{question.text}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {record ? (
            <span className={`text-lg font-semibold ${BAND_TEXT[band(record.evaluation.overall_score)]}`}>
              {record.evaluation.overall_score}/10
            </span>
          ) : (
            <span className="text-sm text-muted">Skipped</span>
          )}
          <span aria-hidden="true" className="text-muted print:hidden">
            {open ? "▲" : "▼"}
          </span>
        </span>
      </button>

      {open ? (
        <div id={panelId} className="space-y-5 border-t border-border p-5">
          {record ? (
            <>
              <div>
                <h3 className="text-sm font-semibold">Your answer</h3>
                <p className="mt-1 whitespace-pre-wrap rounded-xl bg-background p-3 text-sm">{record.text}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {SCORE_KEYS.map((key) => (
                  <ScoreCard key={key} label={SCORE_LABELS[key]} item={record.evaluation[key]} />
                ))}
              </div>

              {question.related_claim ? (
                <div className="rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold">Resume claim check</h3>
                  <p className="mt-1 text-sm text-muted">Claim: {question.related_claim}</p>
                  <p className={`mt-1 text-sm font-semibold ${claimVerdict(record.evaluation.resume_claim_support.score).cls}`}>
                    {claimVerdict(record.evaluation.resume_claim_support.score).label}
                  </p>
                  <p className="text-sm text-muted">{record.evaluation.resume_claim_support.reason}</p>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold">Missing points</h3>
                {record.evaluation.missing_points.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {record.evaluation.missing_points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span aria-hidden="true">☐</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted">Nothing important was missed.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold">A stronger answer</h3>
                <p className="mt-1 rounded-xl bg-accent-soft p-3 text-sm">{record.evaluation.stronger_answer}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <Link href={`/feedback/${session.id}/retry/${question.id}`} className={btnPrimary}>
                  {retry ? "Retry again" : "Retry this answer"}
                </Link>
                {retry ? (
                  <p className="flex items-center gap-2 text-sm">
                    Last retry: <DeltaBadge value={retry.result.overall_delta} />
                  </p>
                ) : null}
              </div>
              {retry ? (
                <div className="print:block">
                  <h3 className="text-sm font-semibold">Retry result</h3>
                  <p className="mt-1 text-sm text-muted">{retry.result.summary}</p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted">You skipped this question, so it has no score.</p>
          )}
        </div>
      ) : null}
    </li>
  );
}
