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
  "inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-highlight)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40";

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

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <AutoRefresh everyMs={300000} />

      <div className="divide-y divide-[var(--border)]">
        <header className="pb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">Explore</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Macro timeline &amp; news
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            No account required for this view.{" "}
            <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
              Sign up
            </Link>{" "}
            for a watchlist and the full dashboard.{" "}
            <Link href={mapHref} className="font-medium text-[var(--accent)] hover:underline">
              Map
            </Link>{" "}
            shows sector → industry movers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard" className={heroActionClass}>
              Open dashboard
            </Link>
            <Link href={mapHref} className={heroActionClass}>
              Open map
            </Link>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            <span className="font-medium tabular-nums text-[var(--foreground)]">{events.length}</span>{" "}
            timeline ·{" "}
            <span className="font-medium tabular-nums text-[var(--foreground)]">{news.length}</span>{" "}
            headlines · watchlist requires sign-in
          </p>
          <p className="mt-2 text-xs text-[var(--faint)]">
            Last fetch{" "}
            <span className="font-mono text-[var(--muted)]">
              {new Date(fetchedAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            {" · "}
            guest · refreshes about every 5 min
          </p>
        </header>

        <section className="py-8">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Watchlist</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
            Saving tickers needs an account.{" "}
            <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
              sign up
            </Link>{" "}
            for the Tickers tab and matched headlines.
          </p>
        </section>

        <section className="space-y-6 py-8 pt-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] sm:p-7">
            <DashboardTimelineTabs
              events={events}
              watchlistItems={watchlistItems}
              perPage={2}
              guestMode
              dataFetchedAt={fetchedAt}
            />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] sm:p-7">
            <NewsBriefing articles={news} itemsPerPage={2} dataFetchedAt={fetchedAt} />
          </div>
        </section>
      </div>
    </div>
  );
}
