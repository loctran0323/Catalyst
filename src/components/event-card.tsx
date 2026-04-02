import type { MarketEvent } from "@/types/database";

const typeStyles: Record<string, string> = {
  earnings: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  macro: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  catalyst: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
};

export function EventCard({
  event,
  showTickerBadge = false,
  readMoreUrl,
}: {
  event: MarketEvent;
  /** Show symbol pill (Tickers timeline tab only). */
  showTickerBadge?: boolean;
  /** Past archive: opens coverage in a new tab (article or news search). */
  readMoreUrl?: string | null;
}) {
  const when = new Date(event.event_date);
  const typeClass = typeStyles[event.event_type] ?? "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30";

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[var(--accent)]/40" data-event-id={event.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {when.toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeClass}`}
          >
            {event.event_type}
          </span>
          {showTickerBadge && event.ticker && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)] ring-1 ring-inset ring-white/10">
              <span className="font-mono">{event.ticker}</span>
            </span>
          )}
        </div>
      </div>
      {readMoreUrl ? (
        <div className="mt-4">
          <a
            href={readMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Read coverage
            <span aria-hidden className="text-xs opacity-80">
              ↗
            </span>
          </a>
        </div>
      ) : null}
      <div className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Why it matters
          </p>
          <p className="mt-1 text-[var(--foreground)]">{event.why_it_matters}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            What to watch
          </p>
          <p className="mt-1 text-[var(--foreground)]">{event.watch_for}</p>
        </div>
      </div>
    </article>
  );
}
