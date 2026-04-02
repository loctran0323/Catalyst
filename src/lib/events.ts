import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketEvent } from "@/types/database";
import {
  getSyntheticMacroTimeline,
  getSyntheticMacroTimelinePast,
  mergeTimelineEvents,
} from "@/lib/macro-timeline";
import { fetchOnlineTickerTimelineEvents } from "@/lib/online-ticker-events";
import { filterPastMarketEvents, filterUpcomingMarketEvents } from "@/lib/timeline-upcoming";

export { filterPastMarketEvents, filterUpcomingMarketEvents };

async function fetchDashboardEventsFromDb(
  supabase: SupabaseClient,
  watchlistTickers: string[],
): Promise<MarketEvent[]> {
  const upper = [...new Set(watchlistTickers.map((t) => t.trim().toUpperCase()))].filter(
    Boolean,
  );

  const { data: macro, error: e1 } = await supabase
    .from("market_events")
    .select("*")
    .is("ticker", null)
    .order("event_date", { ascending: true });

  if (e1) throw e1;

  let byTicker: MarketEvent[] = [];
  if (upper.length > 0) {
    const { data, error: e2 } = await supabase
      .from("market_events")
      .select("*")
      .in("ticker", upper)
      .order("event_date", { ascending: true });
    if (e2) throw e2;
    byTicker = (data ?? []) as MarketEvent[];
  }

  const merged = new Map<string, MarketEvent>();
  for (const e of [...(macro ?? []), ...byTicker] as MarketEvent[]) {
    merged.set(e.id, e);
  }
  return [...merged.values()].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
  );
}

export async function fetchDashboardEvents(
  supabase: SupabaseClient,
  watchlistTickers: string[],
): Promise<MarketEvent[]> {
  const sorted = await fetchDashboardEventsFromDb(supabase, watchlistTickers);
  return filterUpcomingMarketEvents(sorted);
}

/** DB watchlist + macro events merged with a rolling synthetic macro/housing calendar. */
export async function fetchMergedDashboardEvents(
  supabase: SupabaseClient,
  watchlistTickers: string[],
): Promise<MarketEvent[]> {
  const dbEvents = await fetchDashboardEventsFromDb(supabase, watchlistTickers);
  const synthetic = getSyntheticMacroTimeline();
  let online: MarketEvent[] = [];
  try {
    online = await fetchOnlineTickerTimelineEvents(watchlistTickers);
  } catch {
    online = [];
  }
  const withMacro = mergeTimelineEvents(dbEvents, synthetic);
  const merged = mergeTimelineEvents(withMacro, online);
  return filterUpcomingMarketEvents(merged);
}

/** Past-dated timeline rows (DB + synthetic + online RSS) for signed-in archive page. */
export async function fetchMergedPastDashboardEvents(
  supabase: SupabaseClient,
  watchlistTickers: string[],
): Promise<MarketEvent[]> {
  const dbEvents = await fetchDashboardEventsFromDb(supabase, watchlistTickers);
  const synthetic = getSyntheticMacroTimeline();
  const syntheticPast = getSyntheticMacroTimelinePast();
  let online: MarketEvent[] = [];
  try {
    online = await fetchOnlineTickerTimelineEvents(watchlistTickers);
  } catch {
    online = [];
  }
  const withMacro = mergeTimelineEvents(dbEvents, synthetic);
  const withPastMacro = mergeTimelineEvents(withMacro, syntheticPast);
  const merged = mergeTimelineEvents(withPastMacro, online);
  const past = filterPastMarketEvents(merged);
  return past.sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
  );
}

/** Public / guest: rolling synthetic macro calendar only (anon users cannot read `market_events`). */
export function getGuestTimelineEvents(): MarketEvent[] {
  return filterUpcomingMarketEvents(getSyntheticMacroTimeline());
}
