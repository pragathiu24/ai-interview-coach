"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import ErrorBox from "@/components/ErrorBox";
import InterviewerPlaceholder from "@/components/InterviewerPlaceholder";
import NotFoundCard from "@/components/NotFoundCard";
import Thinking from "@/components/Thinking";
import { evaluateAnswer, followUp } from "@/lib/api";
import { MAX_ANSWER_CHARS, USE_MOCKS } from "@/lib/config";
import { btnPrimary, btnSecondary, cardCls, inputCls } from "@/lib/ui";
import { useHydrated } from "@/lib/useHydrated";
import { useSessions } from "@/store/sessions";
import type { Session, SessionQuestion } from "@/types/session";

type Busy = null | "evaluating" | "followup";

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const hydrated = useHydrated();
  const session = useSessions((s) => s.sessions[sessionId]);

  if (!hydrated) return <Thinking title="Loading your interview" />;
  if (!session) {
    return (
      <NotFoundCard
        title="Interview not found"
        text="This interview is not saved on this device. Start a new one from your resume."
      />
    );
  }
  if (session.completed) {
    return (
      <div className={`${cardCls} mx-auto max-w-xl text-center`}>
        <h1 className="text-xl font-semibold">This interview is finished</h1>
        <p className="mt-2 text-sm text-muted">See how you did, or retry any answer from the feedback page.</p>
        <Link href={`/feedback/${session.id}`} className={`${btnPrimary} mt-5`}>
          View feedback
        </Link>
      </div>
    );
  }

  const question = session.questions[session.currentIndex];
  // key makes the room reset (empty answer box, no old errors) for every new question.
  return <Room key={question.id} session={session} question={question} />;
}

function Room({ session, question }: { session: Session; question: SessionQuestion }) {
  const router = useRouter();
  const saveAnswer = useSessions((s) => s.saveAnswer);
  const insertFollowup = useSessions((s) => s.insertFollowup);
  const advance = useSessions((s) => s.advance);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<unknown>(null);

  const total = session.questions.length;
  const number = session.currentIndex + 1;
  const trimmed = text.trim();

  function finishQuestion() {
    const done = advance(session.id);
    if (done) router.push(`/feedback/${session.id}`);
  }

  async function submit() {
    if (!trimmed || busy) return;
    setError(null);
    setBusy("evaluating");
    try {
      const evaluation = await evaluateAnswer({
        question: question.text,
        answer: trimmed,
        related_claim: question.related_claim,
        analysis: session.analysis,
      });
      saveAnswer(session.id, question.id, trimmed, evaluation);

      // Shallow answers get one follow-up question, but follow-ups never get follow-ups.
      if (evaluation.needs_followup && !question.isFollowup) {
        setBusy("followup");
        try {
          const followup = await followUp({ question: question.text, answer: trimmed, evaluation });
          insertFollowup(session.id, question.id, followup);
        } catch {
          // The follow-up is optional; carry on with the interview.
        }
      }
      finishQuestion();
    } catch (e) {
      setError(e);
      setBusy(null);
    }
  }

  function skip() {
    if (busy) return;
    finishQuestion();
  }

  const hint = USE_MOCKS ? undefined : "The AI runs on your computer, so this can take a minute or two.";

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium">
            Question {number} of {total}
            {question.isFollowup ? " (follow-up)" : ""}
          </p>
          <p className="text-muted">
            {session.role} · {session.difficulty}
          </p>
        </div>
        <div
          className="mt-2 h-2 rounded-full bg-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={number}
          aria-label="Interview progress"
        >
          <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${(number / total) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <InterviewerPlaceholder state={busy ? "thinking" : "idle"} />
        </div>

        <div className="space-y-4 lg:col-span-3">
          <section className={cardCls} aria-labelledby="question">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {question.isFollowup ? "Follow-up question" : `${question.type} question`}
            </p>
            <h1 id="question" className="mt-2 text-xl font-semibold leading-snug">
              {question.text}
            </h1>
            {question.related_claim ? (
              <p className="mt-3 rounded-xl bg-accent-soft p-3 text-sm">Resume claim: {question.related_claim}</p>
            ) : null}
          </section>

          {busy ? (
            <Thinking
              title={busy === "evaluating" ? "Scoring your answer..." : "Preparing a follow-up question..."}
              hint={hint}
            />
          ) : (
            <section className={cardCls} aria-labelledby="answer-label">
              <label id="answer-label" htmlFor="answer" className="text-sm font-medium">
                Your answer
              </label>
              <textarea
                id="answer"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_ANSWER_CHARS}
                rows={7}
                placeholder="Type your answer here. Voice answers arrive in the next stage."
                className={`${inputCls} mt-2 resize-y`}
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>Aim for specific tools, numbers and examples.</span>
                <span>
                  {text.length}/{MAX_ANSWER_CHARS}
                </span>
              </div>

              {error ? (
                <div className="mt-4">
                  <ErrorBox error={error} onRetry={submit} />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled
                  aria-label="Microphone answers are not available yet"
                  className={btnSecondary}
                  title="Voice answers arrive in the next stage"
                >
                  Mic: coming soon
                </button>
                <div className="flex gap-3">
                  <button type="button" className={btnSecondary} onClick={skip}>
                    Skip
                  </button>
                  <button type="button" className={btnPrimary} disabled={!trimmed} onClick={submit}>
                    Submit answer
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
