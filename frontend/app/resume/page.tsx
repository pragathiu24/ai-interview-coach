"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { useRouter } from "next/navigation";
import ErrorBox from "@/components/ErrorBox";
import Thinking from "@/components/Thinking";
import { analyzeResume, generateQuestions } from "@/lib/api";
import { MAX_UPLOAD_BYTES, USE_MOCKS } from "@/lib/config";
import { btnPrimary, btnSecondary, cardCls, inputCls } from "@/lib/ui";
import { useSessions } from "@/store/sessions";
import type { Difficulty, ResumeAnalysis } from "@/types/api";

type Phase = "choose" | "analyzing" | "review" | "starting";

const ROLES = [
  "Backend Developer",
  "Frontend Developer",
  "Full-Stack Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
];

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Easy", hint: "Fundamentals" },
  { value: "medium", label: "Medium", hint: "Applied" },
  { value: "hard", label: "Hard", hint: "Design and trade-offs" },
];

const COUNTS = [3, 4, 5, 6];

function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) return "Please choose a PDF or DOCX file.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return "That file is larger than 5 MB.";
  return null;
}

export default function ResumePage() {
  const router = useRouter();
  const createSession = useSessions((s) => s.createSession);
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [role, setRole] = useState("Backend Developer");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(5);

  function pickFile(picked: File | undefined) {
    if (!picked) return;
    const problem = validateFile(picked);
    setFileError(problem);
    setFile(problem ? null : picked);
    setError(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files[0]);
  }

  async function analyze() {
    if (!file) return;
    setError(null);
    setPhase("analyzing");
    try {
      const result = await analyzeResume(file);
      setAnalysis(result);
      setPhase("review");
    } catch (e) {
      setError(e);
      setPhase("choose");
    }
  }

  async function begin() {
    if (!analysis) return;
    setError(null);
    setPhase("starting");
    try {
      const response = await generateQuestions({ analysis, role: role.trim(), difficulty, count });
      if (response.questions.length === 0) {
        throw new Error("The AI did not return any questions. Please try again.");
      }
      const id = createSession({ role: role.trim(), difficulty, analysis, questions: response.questions });
      router.push(`/interview/${id}`);
    } catch (e) {
      setError(e);
      setPhase("review");
    }
  }

  function startOver() {
    setAnalysis(null);
    setFile(null);
    setError(null);
    setPhase("choose");
  }

  const slowHint = USE_MOCKS ? undefined : "The AI runs on your computer, so this can take a minute or two.";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload your resume</h1>
        <p className="mt-1 text-muted">
          The AI reads it, finds your skills and projects, then builds your interview from them.
        </p>
      </div>

      {error ? (
        <ErrorBox error={error} onRetry={phase === "choose" ? (file ? analyze : undefined) : begin} />
      ) : null}

      {phase === "analyzing" ? <Thinking title="Reading your resume..." hint={slowHint} /> : null}
      {phase === "starting" ? <Thinking title="Writing your interview questions..." hint={slowHint} /> : null}

      {phase === "choose" ? (
        <div className={cardCls}>
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose a resume file. PDF or DOCX, up to 5 megabytes."
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              dragging ? "border-accent bg-accent-soft" : "border-border hover:bg-accent-soft"
            }`}
          >
            <p className="font-medium">{file ? file.name : "Drag and drop your resume here"}</p>
            <p className="mt-1 text-sm text-muted">
              {file ? `${(file.size / 1024).toFixed(0)} KB. Click to choose a different file.` : "or click to browse. PDF or DOCX, up to 5 MB."}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
          {fileError ? (
            <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
              {fileError}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end">
            <button type="button" className={btnPrimary} disabled={!file} onClick={analyze}>
              Analyze resume
            </button>
          </div>
        </div>
      ) : null}

      {phase === "review" && analysis ? (
        <>
          <section className={cardCls} aria-labelledby="analysis">
            <h2 id="analysis" className="text-xl font-semibold">
              {analysis.candidate_name ? `Resume analysis for ${analysis.candidate_name}` : "Resume analysis"}
            </h2>
            <p className="mt-2 text-sm text-muted">{analysis.experience_summary}</p>

            <h3 className="mt-5 text-sm font-semibold">Detected skills</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {analysis.skills.map((skill) => (
                <li key={skill} className="rounded-full bg-accent-soft px-3 py-1 text-sm">
                  {skill}
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-sm font-semibold">Projects</h3>
            <ul className="mt-2 space-y-3">
              {analysis.projects.map((project) => (
                <li key={project.name} className="rounded-xl border border-border p-3">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted">{project.description}</p>
                  <p className="mt-1 text-xs text-muted">{project.technologies.join(", ")}</p>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-sm font-semibold">Claims to verify</h3>
            <p className="text-sm text-muted">The interviewer will probe these.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {analysis.claims_to_verify.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          </section>

          <section className={cardCls} aria-labelledby="setup">
            <h2 id="setup" className="text-xl font-semibold">
              Set up your interview
            </h2>

            <label htmlFor="role" className="mt-4 block text-sm font-medium">
              Target role
            </label>
            <input
              id="role"
              list="role-options"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={100}
              className={`${inputCls} mt-1`}
            />
            <datalist id="role-options">
              {ROLES.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium">Difficulty</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={difficulty === d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`rounded-xl border p-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      difficulty === d.value ? "border-accent bg-accent-soft" : "border-border hover:bg-accent-soft"
                    }`}
                  >
                    <span className="block font-medium">{d.label}</span>
                    <span className="text-xs text-muted">{d.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor="count" className="mt-5 block text-sm font-medium">
              Number of questions
            </label>
            <select
              id="count"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className={`${inputCls} mt-1 max-w-40`}
            >
              {COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <button type="button" className={btnSecondary} onClick={startOver}>
                Choose a different file
              </button>
              <button type="button" className={btnPrimary} disabled={role.trim().length < 2} onClick={begin}>
                Begin interview
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
