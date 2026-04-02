import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { NewsBriefing } from "@/components/news-briefing";
import { getGuestTimelineEvents } from "@/lib/events";
import { getNewsBriefing } from "@/lib/news";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistItem } from "@/types/database";

export const dynamic = "force-dynamic";

const heroActionClass =
  "inline-flex items-center rounded-md border border-white/[0.14] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50";

export default async function ExplorePage() {
  let isAuthenticated = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  }
  const mapHref = isAuthenticated ? "/dashboard/map" : "/explore/map";

  const events = getGuestTimelineEvents();
  const news = await getNewsBriefing({ tickers: [], limit: 36 });
  const fetchedAt = new Date().toISOString();
  const watchlistItems: WatchlistItem[] = [];

  const statCards = [
    { label: "Watchlist", value: "—" },
    { label: "Timeline items", value: String(events.length) },
    { label: "News headlines", value: String(news.length) },
  ];

  return (
    <div className="space-y-8">
      <AutoRefresh everyMs={300000} />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-2xl font-semibold text-white">Explore</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Browse the macro timeline, news briefing, and map without an account.{" "}
          <Link href="/signup" className="text-[var(--accent)] hover:underline">
            Sign up
          </Link>{" "}
          to save a watchlist and unlock ticker-specific timeline rows and ticker-tagged headlines. Use
          dashboard for watchlist headlines, upcoming catalysts, and your full workspace, or map for a
          treemap of large-cap movers organized from sector to industry.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/dashboard" className={heroActionClass}>
            Open dashboard
          </Link>
          <Link href={mapHref} className={heroActionClass}>
            Open map
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-wide text-[var(--muted)]">
          Last fetch{" "}
          <span className="font-mono normal-case text-[var(--foreground)]">
            {new Date(fetchedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>{" "}
          · guest mode · macro timeline only · auto-refresh ~5 min
        </p>
      </div>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5">
        <h2 className="text-base font-semibold text-white">Watchlist</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Saving tickers requires an account.{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="text-[var(--accent)] hover:underline">
            create a free account
          </Link>{" "}
          to build a list that powers the Tickers timeline tab and watchlist-matched news.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <DashboardTimelineTabs
          events={events}
          watchlistItems={watchlistItems}
          perPage={2}
          guestMode
        />
      </section>

      <NewsBriefing articles={news} itemsPerPage={2} />
    </div>
  );
}
