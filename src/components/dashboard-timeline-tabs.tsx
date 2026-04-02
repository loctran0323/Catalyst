"use client";

import { useMemo, useState } from "react";
import type { MarketEvent, WatchlistItem } from "@/types/database";
import { filterUpcomingMarketEvents } from "@/lib/timeline-upcoming";
import { TimelinePager } from "@/components/timeline-pager";

type Tab = "macro" | "tickers";

export function DashboardTimelineTabs({
  events,
  watchlistItems,
  perPage = 2,
  guestMode = false,
  pastArchiveMode = false,
  sectionTitle = "Timeline",
  sectionSubtitle,
  readMoreUrlsByEventId,
  dataFetchedAt,
}: {
  events: MarketEvent[];
  watchlistItems: WatchlistItem[];
  perPage?: number;
  guestMode?: boolean;
  pastArchiveMode?: boolean;
  sectionTitle?: string;
  sectionSubtitle?: string;
  readMoreUrlsByEventId?: Record<string, string>;
  dataFetchedAt?: string;
}) {
  const processed = useMemo(() => {
    if (pastArchiveMode) return events;
    return filterUpcomingMarketEvents(events);
  }, [events, pastArchiveMode]);

  const macroEvents = useMemo(
    () => processed.filter((e) => !e.ticker?.trim()),
    [processed],
  );
  const tickerEvents = useMemo(
    () => processed.filter((e) => Boolean(e.ticker?.trim())),
    [processed],
  );

  const [tab, setTab] = useState<Tab>("macro");
  const activeList = tab === "macro" ? macroEvents : tickerEvents;

  const sortedWatchlist = useMemo(
    () => [...watchlistItems].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    [watchlistItems],
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">{sectionTitle}</h2>
        {sectionSubtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{sectionSubtitle}</p>
        ) : null}
        {dataFetchedAt ? (
          <p className="mt-2 text-xs text-[var(--faint)]">
            Updated{" "}
            {new Date(dataFetchedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["macro", "tickers"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              tab === id
                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/35 hover:text-[var(--foreground)]"
            }`}
          >
            {id === "macro" ? "Macro" : "Tickers"} ({id === "macro" ? macroEvents.length : tickerEvents.length})
          </button>
        ))}
      </div>

      {tab === "tickers" ? (
        sortedWatchlist.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--faint)]">
              Your watchlist
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {sortedWatchlist.map((item) => (
                <li
                  key={item.id}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-highlight)] px-3 py-1 text-sm font-medium text-[var(--foreground)]"
                >
                  {item.ticker}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            {guestMode
              ? "Sign in and add tickers to see company-specific catalysts in this tab."
              : "Add tickers in the watchlist above to populate ticker-linked events."}
          </p>
        )
      ) : null}

      <TimelinePager
        key={tab}
        events={activeList}
        perPage={perPage}
        readMoreUrlsByEventId={readMoreUrlsByEventId}
        showTickerBadge={tab === "tickers"}
      />
    </div>
  );
}
