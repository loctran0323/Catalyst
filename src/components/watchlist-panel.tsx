import { addTicker, removeTicker } from "@/app/dashboard/actions";
import type { WatchlistItem } from "@/types/database";

export function WatchlistPanel({
  watchlistId,
  items,
}: {
  watchlistId: string;
  items: WatchlistItem[];
}) {
  const sorted = [...items].sort((a, b) => a.ticker.localeCompare(b.ticker));

  return (
    <div className="space-y-4">
      <form action={addTicker} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input type="hidden" name="watchlist_id" value={watchlistId} />
        <input
          name="ticker"
          placeholder="Ticker (e.g. AAPL)"
          autoComplete="off"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-inner focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 sm:max-w-xs"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0b1220] transition hover:bg-[var(--accent-muted)]"
        >
          Add
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No tickers yet. Add a few symbols to pull in headline matches and ticker timeline rows.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-highlight)] pl-3 text-sm text-[var(--foreground)]"
            >
              <span className="font-semibold">{item.ticker}</span>
              <form action={removeTicker}>
                <input type="hidden" name="item_id" value={item.id} />
                <button
                  type="submit"
                  className="rounded-r-full px-2 py-1 text-[var(--faint)] transition hover:bg-white/5 hover:text-rose-300"
                  aria-label={`Remove ${item.ticker}`}
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
