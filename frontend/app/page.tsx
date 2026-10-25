import Link from "next/link";
import { btnPrimary, btnSecondary, cardCls } from "@/lib/ui";

const steps = [
  {
    title: "Upload your resume",
    text: "Add a PDF or DOCX. The AI pulls out your skills, projects and the claims worth probing.",
  },
  {
    title: "Take the mock interview",
    text: "Answer questions built from your own resume. Weak answers trigger a sharper follow-up.",
  },
  {
    title: "Review, retry, improve",
    text: "Get scores and missing points, retry any answer, and see exactly what got better.",
  },
];

const features = [
  {
    title: "Questions from your resume",
    text: "Every interview is generated from your real projects and the numbers you claim.",
  },
  {
    title: "Four-part scoring",
    text: "Technical accuracy, specificity, clarity and resume-claim support, each with a reason.",
  },
  {
    title: "Retry and compare",
    text: "Answer again and see score changes, newly covered points and what is still missing.",
  },
  {
    title: "A humanoid interviewer",
    text: "A 3D interviewer that speaks the questions and listens to your spoken answers.",
  },
];

const sampleScores = [
  { label: "Technical accuracy", value: 8 },
  { label: "Specificity", value: 6 },
  { label: "Clarity", value: 8 },
  { label: "Resume-claim support", value: 5 },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 py-8 lg:grid-cols-2">
        <div>
          <p className="mb-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium">
            Powered by Gemma 4
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Practice interviews with an AI that has read your resume
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Get questions built from your own projects, honest scores on every answer, and a clear
            view of how much you improve when you try again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/resume" className={btnPrimary}>
              Start practicing
            </Link>
            <Link href="/dashboard" className={btnSecondary}>
              View dashboard
            </Link>
          </div>
        </div>

        <div className={cardCls} aria-label="Sample feedback preview">
          <p className="text-sm text-muted">Sample feedback</p>
          <p className="mt-1 text-lg font-semibold">How did you cut API latency by 40 percent?</p>
          <ul className="mt-4 space-y-3">
            {sampleScores.map((s) => (
              <li key={s.label}>
                <div className="flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-medium">{s.value}/10</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-border" aria-hidden="true">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${s.value * 10}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-accent-soft p-3 text-sm">
            Missing: how latency was measured before and after the change.
          </p>
        </div>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className={cardCls}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="features">
        <h2 id="features" className="text-2xl font-semibold">
          Built to help you improve
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className={cardCls}>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${cardCls} text-center`}>
        <h2 className="text-2xl font-semibold">Ready for your next interview?</h2>
        <p className="mt-2 text-muted">It takes a few minutes, and your sessions stay on your device.</p>
        <Link href="/resume" className={`${btnPrimary} mt-5`}>
          Start practicing
        </Link>
      </section>
    </div>
  );
}
