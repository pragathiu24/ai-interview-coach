import Link from "next/link";
import { btnPrimary, btnSecondary, cardCls } from "@/lib/ui";

export default function NotFoundCard({ title, text }: { title: string; text: string }) {
  return (
    <div className={`${cardCls} mx-auto max-w-xl text-center`}>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted">{text}</p>
      <div className="mt-5 flex justify-center gap-3">
        <Link href="/resume" className={btnPrimary}>
          New interview
        </Link>
        <Link href="/dashboard" className={btnSecondary}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
