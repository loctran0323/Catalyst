import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Updates",
};

const UPDATE_GROUPS: { period: string; bullets: string[] }[] = [
  {
    period: "April 2026",
    bullets: [
      "Market map: larger default view, zoom range, clipped labels, short sector/industry names (no cut-off with …).",
      "Macro timeline: fewer duplicate events, Eastern-time dates, tier-1 releases only (up to ~8 in 30 days, fewer if the calendar is light).",
      "News tags: better bullish / bearish / neutral (e.g. falling commodity prices skew bearish).",
      "Archive news: only items older than three days so it doesn’t overlap the live briefing.",
      "Dashboard dates and “Updated” times use US Eastern (ET).",
      "Splash page: six feature cards with clearer copy.",
    ],
  },
  {
    period: "Earlier",
    bullets: [
      "Watchlist, dashboard timeline, RSS news briefing (optional AI summaries), sector → industry market map.",
      "Guest Explore view, email digest settings when Resend is configured.",
    ],
  },
];

export default function DashboardUpdatesPage() {
  return (
    <div className="mx-auto max-w-2xl pb-12">
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">Alpha Brief</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Updates
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
          If you have any questions, comments, or suggestions about the website, email{" "}
          <a
            href="mailto:locmarkets@gmail.com"
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            locmarkets@gmail.com
          </a>
          .
        </p>
      </header>

      <div className="mt-8 space-y-10">
        {UPDATE_GROUPS.map((g) => (
          <section key={g.period}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">{g.period}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
              {g.bullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10">
        <Link href="/home" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← Back to Home
        </Link>
      </p>
    </div>
  );
}
