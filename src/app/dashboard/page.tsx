import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DashboardQueryError } from "@/components/dashboard-query-error";
import { DashboardTimelineTabs } from "@/components/dashboard-timeline-tabs";
import { NewsBriefing } from "@/components/news-briefing";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { fetchMergedDashboardEvents } from "@/lib/events";
import { getNewsBriefing } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { formatDateHeading } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  let events;
  try {
    events = await fetchMergedDashboardEvents(supabase, tickers);
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return <DashboardQueryError context="Loading timeline" err={err} />;
  }

  const news = await getNewsBriefing({ tickers, limit: 72 });
  const serverFetchedAt = new Date().toISOString();
  const todayHeading = formatDateHeading(new Date());

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <AutoRefresh everyMs={300000} />

      <div className="divide-y divide-[var(--border)]">
        <header className="pb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {todayHeading}
          </h1>
          <div className="mt-2 w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <p className="w-max whitespace-nowrap text-sm text-[var(--muted)]">
              Watchlist, upcoming macro and ticker catalysts, and a ranked news briefing.{" "}
              <Link href="/dashboard/archive" className="font-medium text-[var(--accent)] hover:underline">
                Archive
              </Link>{" "}
              holds older headlines and past events.
            </p>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            <span className="font-medium tabular-nums text-[var(--foreground)]">{events.length}</span> timeline
            <span className="mx-2 text-[var(--faint)]">·</span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">{news.length}</span> headlines
            <span className="mx-2 text-[var(--faint)]">·</span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">{items?.length ?? 0}</span>{" "}
            watchlist
          </p>
        </header>

        <section className="py-8">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Watchlist</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Symbols drive ticker-specific timeline rows and headline matching.
          </p>
          <div className="mt-4">
            <WatchlistPanel watchlistId={watchlist.id} items={items ?? []} />
          </div>
        </section>

        <section className="space-y-6 py-8 pt-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] sm:p-7">
            <DashboardTimelineTabs
              events={events}
              watchlistItems={items ?? []}
              perPage={3}
              dataFetchedAt={serverFetchedAt}
            />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] sm:p-7">
            <NewsBriefing articles={news} itemsPerPage={4} dataFetchedAt={serverFetchedAt} />
          </div>
        </section>
      </div>
    </div>
  );
}
