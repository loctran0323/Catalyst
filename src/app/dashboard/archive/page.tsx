import Link from "next/link";
import { ArchiveDateToolbar } from "@/components/archive-date-toolbar";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { NewsBriefing } from "@/components/news-briefing";
import {
  filterEventsByEventDateRange,
  parseArchiveSearchParams,
  toYmdUtc,
} from "@/lib/archive-range";
import { fetchMergedPastDashboardEvents } from "@/lib/events";
import { fetchReadMoreUrlsWithConcurrency } from "@/lib/release-web-context";
import { getArchivedNewsBriefing } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardArchivePage({ searchParams }: Props) {
  const sp = await searchParams;
  const bounds = parseArchiveSearchParams(sp);
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

  const tickers = (items ?? []).map((i) => i.ticker);

  let pastEventsAll;
  try {
    pastEventsAll = await fetchMergedPastDashboardEvents(supabase, tickers);
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return <DashboardQueryError context="Loading past timeline" err={err} />;
  }

  const pastEvents = filterEventsByEventDateRange(
    pastEventsAll,
    bounds.eventsFromMs,
    bounds.eventsToMs,
  );

  const readMoreUrlsByEventId = await fetchReadMoreUrlsWithConcurrency(pastEvents, 4);

  const archivedNews = await getArchivedNewsBriefing({
    tickers,
    limit: 200,
    publishedFromMs: bounds.newsFromMs,
    publishedToMs: bounds.newsToMs,
  });

  return (
    <div className="space-y-8">
      <AutoRefresh everyMs={300000} />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Archive</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Past timeline and headlines that no longer show on the main dashboard, usually about 3–30 days
              back.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <ArchiveDateToolbar
        key={`${bounds.eventsFromMs}-${bounds.eventsToMs}-${bounds.newsFromMs}-${bounds.newsToMs}`}
        eventsFromYmd={toYmdUtc(bounds.eventsFromMs)}
        eventsToYmd={toYmdUtc(bounds.eventsToMs)}
        newsFromYmd={toYmdUtc(bounds.newsFromMs)}
        newsToYmd={toYmdUtc(bounds.newsToMs)}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <DashboardTimelineTabs
          events={pastEvents}
          watchlistItems={items ?? []}
          perPage={2}
          pastArchiveMode
          sectionTitle="Past timeline"
          sectionSubtitle="Read coverage opens the top matching article or a news search. Use the arrows to page through."
          readMoreUrlsByEventId={readMoreUrlsByEventId}
        />
      </section>

      <NewsBriefing
        title="Archived news"
        articles={archivedNews}
        itemsPerPage={2}
        emptyHintTickers="No watchlist-tagged headlines in this range. Try All, widen dates, or check back later."
      />
    </div>
  );
}
