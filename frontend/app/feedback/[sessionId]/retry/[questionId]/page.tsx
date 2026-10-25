"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import DeltaBadge from "@/components/DeltaBadge";
import ErrorBox from "@/components/ErrorBox";
import NotFoundCard from "@/components/NotFoundCard";
import Thinking from "@/components/Thinking";
import { compareAnswers } from "@/lib/api";
import { MAX_ANSWER_CHARS, USE_MOCKS } from "@/lib/config";
import { BAND_TEXT, band } from "@/lib/scoring";
import { btnPrimary, btnSecondary, cardCls, inputCls } from "@/lib/ui";
import { useHydrated } from "@/lib/useHydrated";
import { useSessions } from "@/store/sessions";
import { SCORE_KEYS, SCORE_LABELS } from "@/types/api";

export default function RetryPage() {
  const { sessionId, questionId } = useParams<{ sessionId: string; questionId: string }>();
  const hydrated = useHydrated();
  const session = useSessions((s) => s.sessions[sessionId]);
  const saveRetry = useSessions((s) => s.saveRetry);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState(false);

  if (!hydrated) return <Thinking title="Loading" />;

  const question = session?.questions.find((q) => q.id === questionId);
  const record = session?.answers[questionId];
  if (!session || !question || !record) {
    return (
      <NotFoundCard
        title="Answer not found"
        text="This question has no saved answer to retry. Open your feedback and pick a scored question."
      />
    );
  }

  const retry = session.retries[questionId];
  const trimmed = text.trim();
  const showResult = Boolean(retry) && !editing;

  async function submit() {
    if (!trimmed || busy || !session || !question || !record) return;
    setError(null);
    setBusy(true);
    try {
      const result = await compareAnswers({
        question: question.text,
        first_answer: record.text,
        retry_answer: trimmed,
        related_claim: question.related_claim,
        analysis: session.analysis,
      });
      saveRetry(session.id, question.id, trimmed, result);
      setEditing(false);
      setText("");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const hint = USE_MOCKS ? undefined : "The AI runs on your computer, so this can take a minute or two.";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href={`/feedback/${session.id}`} className="text-sm text-muted underline hover:text-foreground">
          Back to feedback
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{showResult ? "Retry comparison" : "Retry this answer"}</h1>
        <p className="mt-2 text-lg">{question.text}</p>
      </div>

      {busy ? <Thinking title="Comparing your answers..." hint={hint} /> : null}

      {!busy && !showResult ? (
        <>
          <details className={cardCls}>
            <summary className="cursor-pointer font-medium">Previous feedback ({record.evaluation.overall_score}/10)</summary>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <h2 className="font-semibold">Your first answer</h2>
                <p className="mt-1 whitespace-pre-wrap text-muted">{record.text}</p>
              </div>
              <div>
                <h2 className="font-semibold">Missing points</h2>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {record.evaluation.missing_points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-semibold">A stronger answer</h2>
                <p className="mt-1 rounded-xl bg-accent-soft p-3">{record.evaluation.stronger_answer}</p>
              </div>
            </div>
          </details>

          <section className={cardCls}>
            <label htmlFor="retry" className="text-sm font-medium">
              Your new answer
            </label>
            <textarea
              id="retry"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={MAX_ANSWER_CHARS}
              rows={8}
              placeholder="Answer again, covering the missing points."
              className={`${inputCls} mt-2 resize-y`}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {text.length}/{MAX_ANSWER_CHARS}
            </p>
            {error ? (
              <div className="mt-3">
                <ErrorBox error={error} onRetry={submit} />
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              {retry ? (
                <button type="button" className={btnSecondary} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              ) : null}
              <button type="button" className={btnPrimary} disabled={!trimmed} onClick={submit}>
                Compare answers
              </button>
            </div>
          </section>
        </>
      ) : null}

      {!busy && showResult && retry ? (
        <>
          <section className="grid gap-4 md:grid-cols-2" aria-label="First answer and retry side by side">
            <div className={cardCls}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">First answer</p>
              <p className={`mt-1 text-3xl font-bold ${BAND_TEXT[band(retry.result.overall_first)]}`}>
                {retry.result.overall_first}/10
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{record.text}</p>
            </div>
            <div className={cardCls}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Retry</p>
              <p className={`mt-1 text-3xl font-bold ${BAND_TEXT[band(retry.result.overall_retry)]}`}>
                {retry.result.overall_retry}/10
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{retry.retryAnswer}</p>
            </div>
          </section>

          <section className={cardCls} aria-labelledby="deltas">
            <h2 id="deltas" className="font-semibold">
              Score changes
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Skill
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      First
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Retry
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SCORE_KEYS.map((key) => (
                    <tr key={key} className="border-t border-border">
                      <th scope="row" className="py-2 pr-4 text-left font-normal">
                        {SCORE_LABELS[key]}
                      </th>
                      <td className="py-2 pr-4">{retry.result.first_scores[key]}</td>
                      <td className="py-2 pr-4">{retry.result.retry_scores[key]}</td>
                      <td className="py-2">
                        <DeltaBadge value={retry.result.deltas[key]} />
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-semibold">
                    <th scope="row" className="py-2 pr-4 text-left">
                      Overall
                    </th>
                    <td className="py-2 pr-4">{retry.result.overall_first}</td>
                    <td className="py-2 pr-4">{retry.result.overall_retry}</td>
                    <td className="py-2">
                      <DeltaBadge value={retry.result.overall_delta} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className={cardCls}>
              <h2 className="font-semibold">Newly covered</h2>
              {retry.result.newly_covered_points.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {retry.result.newly_covered_points.map((point) => (
                    <li key={point} className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No new points were covered.</p>
              )}
            </div>
            <div className={cardCls}>
              <h2 className="font-semibold">Still missing</h2>
              {retry.result.still_missing.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {retry.result.still_missing.map((point) => (
                    <li key={point} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">Nothing important is missing.</p>
              )}
            </div>
          </section>

          <section className={cardCls}>
            <h2 className="font-semibold">What improved and what still needs work</h2>
            <p className="mt-2 text-sm">{retry.result.summary}</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href={`/feedback/${session.id}`} className={btnPrimary}>
              Back to feedback
            </Link>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setText("");
                setEditing(true);
              }}
            >
              Try another retry
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
