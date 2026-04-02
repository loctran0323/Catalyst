import type { MarketEvent } from "@/types/database";

const DAY_MS = 24 * 60 * 60 * 1000;

/** RSS-backed news is only merged for roughly this lookback. */
export const ARCHIVE_NEWS_MAX_LOOKBACK_MS = 30 * DAY_MS;

export type ArchiveSectionBounds = {
  eventsFromMs: number;
  eventsToMs: number;
  newsFromMs: number;
  newsToMs: number;
};

function startOfUtcDayFromYmd(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return Date.UTC(y, mo - 1, d, 0, 0, 0, 0);
}

function endOfUtcDayFromYmd(ymd: string): number | null {
  const start = startOfUtcDayFromYmd(ymd);
  if (start == null) return null;
  return start + DAY_MS - 1;
}

function parseYmdBound(
  raw: string | undefined,
  edge: "start" | "end",
  fallbackMs: number,
): number {
  if (!raw?.trim()) return fallbackMs;
  const ms =
    edge === "start" ? startOfUtcDayFromYmd(raw) : endOfUtcDayFromYmd(raw);
  return ms ?? fallbackMs;
}

export function utcDayStartMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

export function utcDayEndMs(ms: number): number {
  return utcDayStartMs(ms) + DAY_MS - 1;
}

export function defaultArchiveBounds(nowMs = Date.now()): ArchiveSectionBounds {
  const end = Math.min(nowMs, utcDayEndMs(nowMs));
  const start = utcDayStartMs(nowMs - ARCHIVE_NEWS_MAX_LOOKBACK_MS);
  return {
    eventsFromMs: start,
    eventsToMs: end,
    newsFromMs: start,
    newsToMs: end,
  };
}

/**
 * Parse optional `eventsFrom` / `eventsTo` / `newsFrom` / `newsTo` (`YYYY-MM-DD`) from the archive URL.
 * Missing keys use defaults; invalid dates fall back. Ensures from <= to per section.
 */
export function parseArchiveSearchParams(
  sp: Record<string, string | string[] | undefined>,
  nowMs = Date.now(),
): ArchiveSectionBounds {
  const def = defaultArchiveBounds(nowMs);
  const str = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  let eventsFromMs = parseYmdBound(str("eventsFrom"), "start", def.eventsFromMs);
  let eventsToMs = parseYmdBound(str("eventsTo"), "end", def.eventsToMs);
  let newsFromMs = parseYmdBound(str("newsFrom"), "start", def.newsFromMs);
  let newsToMs = parseYmdBound(str("newsTo"), "end", def.newsToMs);

  const rssStart = utcDayStartMs(nowMs - ARCHIVE_NEWS_MAX_LOOKBACK_MS);
  newsFromMs = Math.max(rssStart, Math.min(newsFromMs, nowMs));
  newsToMs = Math.max(rssStart, Math.min(newsToMs, nowMs));
  if (newsFromMs > newsToMs) [newsFromMs, newsToMs] = [newsToMs, newsFromMs];

  eventsFromMs = Math.min(eventsFromMs, nowMs);
  eventsToMs = Math.min(eventsToMs, nowMs);
  if (eventsFromMs > eventsToMs) [eventsFromMs, eventsToMs] = [eventsToMs, eventsFromMs];

  return {
    eventsFromMs,
    eventsToMs,
    newsFromMs,
    newsToMs,
  };
}

export function filterEventsByEventDateRange(
  events: MarketEvent[],
  fromMs: number,
  toMs: number,
): MarketEvent[] {
  return events.filter((e) => {
    const t = new Date(e.event_date).getTime();
    if (Number.isNaN(t)) return false;
    return t >= fromMs && t <= toMs;
  });
}

export function filterArticlesByPublishedRange<
  T extends { publishedAt: string | null },
>(articles: T[], fromMs: number, toMs: number): T[] {
  return articles.filter((a) => {
    if (!a.publishedAt) return false;
    const t = Date.parse(a.publishedAt);
    if (Number.isNaN(t)) return false;
    return t >= fromMs && t <= toMs;
  });
}

export function toYmdUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const DASH_TIMELINE_AHEAD_MS = 120 * DAY_MS;
const DASH_NEWS_LOOKBACK_MS = 3 * DAY_MS;

export type DashboardDateFilters = {
  timelineFilter: { fromMs: number; toMs: number } | null;
  newsFilter: { fromMs: number; toMs: number } | null;
  toolbar: {
    eventsFromYmd: string;
    eventsToYmd: string;
    newsFromYmd: string;
    newsToYmd: string;
  };
};

/** Optional `eventsFrom` / `eventsTo` / `newsFrom` / `newsTo` on the main dashboard. */
export function parseDashboardSearchParams(
  sp: Record<string, string | string[] | undefined>,
  nowMs = Date.now(),
): DashboardDateFilters {
  const str = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const hasTimeline = Boolean(str("eventsFrom")?.trim() || str("eventsTo")?.trim());
  const hasNews = Boolean(str("newsFrom")?.trim() || str("newsTo")?.trim());

  const defaultTFrom = utcDayStartMs(nowMs);
  const defaultTTo = utcDayEndMs(nowMs + DASH_TIMELINE_AHEAD_MS);
  const defaultNFrom = utcDayStartMs(nowMs - DASH_NEWS_LOOKBACK_MS);
  const defaultNTo = Math.min(nowMs, utcDayEndMs(nowMs));

  let timelineFilter: DashboardDateFilters["timelineFilter"] = null;
  if (hasTimeline) {
    let fromMs = parseYmdBound(str("eventsFrom"), "start", defaultTFrom);
    let toMs = parseYmdBound(str("eventsTo"), "end", defaultTTo);
    if (fromMs > toMs) [fromMs, toMs] = [toMs, fromMs];
    timelineFilter = { fromMs, toMs };
  }

  let newsFilter: DashboardDateFilters["newsFilter"] = null;
  if (hasNews) {
    let fromMs = parseYmdBound(str("newsFrom"), "start", defaultNFrom);
    let toMs = parseYmdBound(str("newsTo"), "end", defaultNTo);
    if (fromMs > toMs) [fromMs, toMs] = [toMs, fromMs];
    newsFilter = { fromMs, toMs };
  }

  const toolbar = {
    eventsFromYmd: str("eventsFrom")?.trim() || toYmdUtc(timelineFilter?.fromMs ?? defaultTFrom),
    eventsToYmd: str("eventsTo")?.trim() || toYmdUtc(timelineFilter?.toMs ?? defaultTTo),
    newsFromYmd: str("newsFrom")?.trim() || toYmdUtc(newsFilter?.fromMs ?? defaultNFrom),
    newsToYmd: str("newsTo")?.trim() || toYmdUtc(newsFilter?.toMs ?? defaultNTo),
  };

  return { timelineFilter, newsFilter, toolbar };
}
