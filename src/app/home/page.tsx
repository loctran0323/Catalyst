import Link from "next/link";
import { HomeMoverList } from "@/components/home-mover-list";
import { HomeTickerMonitor } from "@/components/home-ticker-monitor";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchMarketHomeData } from "@/lib/market-home-data";
import { fetchYahooChartSnapshot } from "@/lib/market-map-data";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistItem } from "@/types/database";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const moneyWide = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(value: number | null, symbol: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (symbol.startsWith("^") && value >= 1000) {
    return moneyWide.format(value);
  }
  return money.format(value);
}

function pctClass(pct: number): string {
  if (pct > 0.005) return "text-emerald-400";
  if (pct < -0.005) return "text-red-400";
  return "text-[var(--muted)]";
}

const heroActionClass =
  "inline-flex items-center rounded-md border border-white/[0.14] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50";

export default async function HomePage() {
  const data = await fetchMarketHomeData();

  let isAuthenticated = false;
  let watchlistId: string | null = null;
  let savedItems: WatchlistItem[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isAuthenticated = true;
      const { data: watchlists } = await supabase
        .from("watchlists")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1);
      watchlistId = watchlists?.[0]?.id ?? null;
      if (watchlistId) {
        const { data: items } = await supabase
          .from("watchlist_items")
          .select("*")
          .eq("watchlist_id", watchlistId)
          .order("created_at", { ascending: true });
        savedItems = items ?? [];
      }
    }
  }

  const savedQuotes = await Promise.all(
    savedItems.map(async (item) => {
      const sym = item.ticker.trim().toUpperCase();
      const snap = await fetchYahooChartSnapshot(sym);
      return {
        symbol: sym,
        shortName: snap?.shortName ?? sym,
        price: snap?.price ?? null,
        changePct: snap?.changePct ?? 0,
      };
    }),
  );

  const mapHref = isAuthenticated ? "/dashboard/map" : "/explore/map";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">Home</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Market snapshot</h1>
        <p className="mt-4 max-w-3xl text-xs leading-snug text-[var(--muted)] sm:text-sm">
          Watchlists, catalysts, and workspace on the dashboard; large-cap sector treemap on the map.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/dashboard" className={heroActionClass}>
            Open dashboard
          </Link>
          <Link href={mapHref} className={heroActionClass}>
            Open map
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
              ETFs &amp; indices
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
              {data.benchmarks.map((b) => (
                <div
                  key={b.symbol}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 sm:px-3.5 sm:py-3"
                >
                  <p className="line-clamp-2 min-h-[2rem] text-[11px] leading-snug text-[var(--muted)] sm:text-xs">
                    {b.label}
                  </p>
                  <p className="mt-1 font-mono text-[10px] font-medium text-white sm:text-xs">{b.symbol}</p>
                  <p className="mt-1.5 text-base font-semibold tabular-nums text-white sm:text-lg">
                    {formatPrice(b.price, b.symbol)}
                  </p>
                  <p className={`text-xs tabular-nums sm:text-sm ${pctClass(b.changePct)}`}>
                    {b.changePct >= 0 ? "+" : ""}
                    {b.changePct.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <HomeMoverList
              title="Top gainers"
              subtitle="Largest % up in the session (US equities screener)."
              rows={data.gainers}
              emptyHint="No gainers loaded — market closed or data temporarily unavailable."
            />
            <HomeMoverList
              title="Top losers"
              subtitle="Largest % down in the session (US equities screener)."
              rows={data.losers}
              emptyHint="No losers loaded — market closed or data temporarily unavailable."
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <HomeMoverList
              title="Most active"
              subtitle="By share volume (screener)."
              rows={data.mostActives}
              emptyHint="Could not load most-active list."
            />
            <HomeMoverList
              title="Largest market cap"
              subtitle="Mega-cap leaders (screener)."
              rows={data.largestByCap}
              emptyHint="Could not load market-cap list."
            />
          </section>
        </div>

        <aside className="w-full shrink-0 lg:w-[17.5rem] xl:w-[19rem]">
          <HomeTickerMonitor
            layout="sidebar"
            isAuthenticated={isAuthenticated}
            watchlistId={watchlistId}
            savedItems={savedItems}
            savedQuotes={savedQuotes}
          />
        </aside>
      </div>
    </div>
  );
}
