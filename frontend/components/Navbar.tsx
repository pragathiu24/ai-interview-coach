"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { USE_MOCKS } from "@/lib/config";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resume", label: "New interview" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm text-accent-foreground"
          >
            AI
          </span>
          <span>Interview Coach</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-accent-soft font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {USE_MOCKS ? (
            <span className="ml-1 hidden rounded-full border border-border px-2 py-1 text-xs text-muted sm:inline">
              Demo data
            </span>
          ) : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
