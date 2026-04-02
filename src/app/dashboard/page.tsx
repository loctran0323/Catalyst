import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardDateToolbar } from "@/components/dashboard-date-toolbar";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { NewsBriefing } from "@/components/news-briefing";
import { WatchlistPanel } from "@/components/watchlist-panel";
import {
  filterArticlesByPublishedRange,
  filterEventsByEventDateRange,
  parseDashboardSearchParams,
} from "@/lib/archive-range";
import { fetchMergedDashboardEvents } from "@/lib/events";
import { getNewsBriefing } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";

/** Re-run this page on every `router.refresh()` — avoids stale RSC payload when polling for news/timeline. */
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const dashDates = parseDashboardSearchParams(sp);
  const supabase = await createClient();

  const { data: watchlists, error: wErr } = await supabase
    .from("watchlists")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1);

  if (wErr) {
    return <DashboardQueryError context="Loading watchlists" err={wErr} />;
  }

  const watchlist = watchlists?.[0];
  if (!watchlist) {
    return (
      <p className="text-[var(--muted)]">
        No watchlist found. Try signing out and back in, or run the database migration.
      </p>
    );
  }

  const { data: items, error: iErr } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("watchlist_id", watchlist.id)
    .order("created_at", { ascending: true });

  if (iErr) {
    return <DashboardQueryError context="Loading watchlist tickers" err={iErr} />;
  }

  let events;
  const tickers = (items ?? []).map((i) => i.ticker);
  try {
    events = await fetchMergedDashboardEvents(supabase, tickers);
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return <DashboardQueryError context="Loading events" err={err} />;
  }

  if (dashDates.timelineFilter) {
    events = filterEventsByEventDateRange(
      events,
      dashDates.timelineFilter.fromMs,
      dashDates.timelineFilter.toMs,
    );
  }

  let news = await getNewsBriefing({ tickers, limit: 72 });
  if (dashDates.newsFilter) {
    news = filterArticlesByPublishedRange(
      news,
      dashDates.newsFilter.fromMs,
      dashDates.newsFilter.toMs,
    );
  }

  const statCards = [
    { label: "Tickers", value: String(tickers.length) },
    { label: "Timeline items", value: String(events.length) },
    { label: "News headlines", value: String(news.length) },
  ];

  return (
    <div className="space-y-8">
      <AutoRefresh everyMs={300000} />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-2xl font-semibold text-white">Market dashboard</h1>
        <div className="mt-2 max-w-full overflow-x-auto">
          <p className="whitespace-nowrap text-sm text-[var(--muted)]">
            Your watchlist shapes which ticker-tagged headlines and events you see.{" "}
            <Link href="/dashboard/archive" className="text-[var(--accent)] hover:underline">
              More and older posts are on Archive.
            </Link>
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <DashboardDateToolbar
        key={`${dashDates.toolbar.eventsFromYmd}-${dashDates.toolbar.eventsToYmd}-${dashDates.toolbar.newsFromYmd}-${dashDates.toolbar.newsToYmd}`}
        eventsFromYmd={dashDates.toolbar.eventsFromYmd}
        eventsToYmd={dashDates.toolbar.eventsToYmd}
        newsFromYmd={dashDates.toolbar.newsFromYmd}
        newsToYmd={dashDates.toolbar.newsToYmd}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
        <h2 className="text-base font-semibold text-white">Watchlist</h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Drives ticker news and timeline rows. Click × on a chip to remove.
        </p>
        <WatchlistPanel watchlistId={watchlist.id} items={items ?? []} />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <DashboardTimelineTabs events={events} watchlistItems={items ?? []} perPage={2} />
      </section>

      <NewsBriefing articles={news} itemsPerPage={2} />
    </div>
  );
}
