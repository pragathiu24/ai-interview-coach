import { cardCls } from "@/lib/ui";

export default function Thinking({ title, hint }: { title: string; hint?: string }) {
  return (
    <div role="status" aria-live="polite" className={`${cardCls} text-center`}>
      <p className="font-medium">{title}</p>
      <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-border">
        <div className="indeterminate-bar h-full w-1/3 rounded-full bg-accent" />
      </div>
      {hint ? <p className="mt-3 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
