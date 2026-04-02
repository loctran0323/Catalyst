import type { MarketEvent } from "@/types/database";

/** True if the instant is exactly UTC midnight (all-day / date-only style rows). */
function isUtcMidnight(d: Date): boolean {
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

/**
 * Timeline shows upcoming items only:
 * - Timed events (earnings, synthetic macro times, RSS pubDates): keep if `event_date` is in the future.
 * - UTC-midnight rows (classic “on this calendar day” DB dates): keep if that UTC day is today or later.
 */
/** Events strictly before “now” or before today (UTC date-only rows). Complement of upcoming filter. */
export function filterPastMarketEvents(events: MarketEvent[], now = new Date()): MarketEvent[] {
  const startOfTodayUtc = new Date(now);
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);
  const startTodayMs = startOfTodayUtc.getTime();
  const nowMs = now.getTime();

  return events.filter((e) => {
    const d = new Date(e.event_date);
    if (Number.isNaN(d.getTime())) return false;

    if (isUtcMidnight(d)) {
      const day = new Date(d);
      day.setUTCHours(0, 0, 0, 0);
      return day.getTime() < startTodayMs;
    }

    return d.getTime() < nowMs;
  });
}

export function filterUpcomingMarketEvents(events: MarketEvent[], now = new Date()): MarketEvent[] {
  const startOfTodayUtc = new Date(now);
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);
  const startTodayMs = startOfTodayUtc.getTime();
  const nowMs = now.getTime();

  return events.filter((e) => {
    const d = new Date(e.event_date);
    if (Number.isNaN(d.getTime())) return false;

    if (isUtcMidnight(d)) {
      const day = new Date(d);
      day.setUTCHours(0, 0, 0, 0);
      return day.getTime() >= startTodayMs;
    }

    return d.getTime() >= nowMs;
  });
}
