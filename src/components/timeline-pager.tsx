"use client";

import { useMemo, useState } from "react";
import type { MarketEvent } from "@/types/database";
import { EventCard } from "@/components/event-card";

type Props = {
  events: MarketEvent[];
  perPage?: number;
  readMoreUrlsByEventId?: Record<string, string>;
  showTickerBadge?: boolean;
};

export function TimelinePager({
  events,
  perPage = 2,
  readMoreUrlsByEventId,
  showTickerBadge = true,
}: Props) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(events.length / perPage));
  const safePage = Math.min(page, pageCount - 1);

  const slice = useMemo(() => {
    const start = safePage * perPage;
    return events.slice(start, start + perPage);
  }, [events, perPage, safePage]);

  if (events.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        Nothing in this tab for now. Try the other tab or refresh in a few minutes.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="divide-y divide-[var(--border)]">
        {slice.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            showTickerBadge={showTickerBadge}
            readMoreUrl={readMoreUrlsByEventId?.[event.id] ?? null}
          />
        ))}
      </div>
      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition enabled:hover:border-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-[var(--faint)]">
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition enabled:hover:border-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}
