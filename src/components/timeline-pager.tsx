"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { MarketEvent } from "@/types/database";
import { EventCard } from "@/components/event-card";

export function TimelinePager({
  events,
  perPage = 2,
  header,
  showTickerOnCards = false,
  emptyMessage,
  readMoreUrlsByEventId,
}: {
  events: MarketEvent[];
  perPage?: number;
  header: ReactNode;
  /** When true, show the symbol pill on each card (Tickers tab). */
  showTickerOnCards?: boolean;
  emptyMessage?: string;
  readMoreUrlsByEventId?: Record<string, string>;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(events.length / perPage));

  useEffect(() => {
    setPage(0);
  }, [events, showTickerOnCards, readMoreUrlsByEventId]);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const slice = useMemo(() => {
    const p = Math.min(page, pageCount - 1);
    return events.slice(p * perPage, p * perPage + perPage);
  }, [events, page, pageCount, perPage]);

  return (
    <div className="space-y-4">
      <div className="min-w-0">{header}</div>
      {events.length > perPage && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white transition enabled:hover:border-[var(--accent)]/50 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white transition enabled:hover:border-[var(--accent)]/50 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              →
            </button>
          </div>
        </div>
      )}
      {events.length === 0 && emptyMessage ? (
        <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-4">
          {slice.map((event) => (
            <li key={event.id}>
              <EventCard
                event={event}
                showTickerBadge={showTickerOnCards}
                readMoreUrl={readMoreUrlsByEventId?.[event.id] ?? null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
