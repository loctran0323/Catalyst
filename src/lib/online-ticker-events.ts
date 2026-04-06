import crypto from "node:crypto";
import type { MarketEvent } from "@/types/database";
import { rssFirstItem } from "@/lib/rss-parse";

const UA = "Mozilla/5.0 (compatible; AlphaBrief/1.0)";

async function latestHeadlineForSymbol(symbol: string): Promise<{
  title: string;
  link: string;
  pubDate: string;
} | null> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${symbol} stock`)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const xml = await res.text();
    return rssFirstItem(xml);
  } catch {
    return null;
  }
}

function toEvent(symbol: string, row: { title: string; link: string; pubDate: string }): MarketEvent {
  const t = Date.parse(row.pubDate);
  const eventDate = Number.isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
  const idBase = `${symbol}-${row.link}-${row.title}`.slice(0, 200);
  const id = `rss-${crypto.createHash("sha1").update(idBase).digest("hex").slice(0, 28)}`;
  const shortTitle = row.title.length > 120 ? `${row.title.slice(0, 117)}…` : row.title;

  return {
    id,
    ticker: symbol,
    title: shortTitle,
    event_type: "catalyst",
    event_date: eventDate,
    why_it_matters:
      "Latest public headline for this symbol from Google News RSS. Third-party, delayed; not investment advice.",
    watch_for: (() => {
      try {
        const host = new URL(row.link).hostname.replace(/^www\./, "");
        return `Open the linked article (${host}) or search the headline in your browser.`;
      } catch {
        return "Verify details on a trusted news source before acting.";
      }
    })(),
    created_at: new Date().toISOString(),
  };
}

/**
 * One recent Google News RSS headline per **watchlist** symbol only (no curated universe).
 * Merged with DB + synthetic macro; deduped by merge key (title + day).
 */
export async function fetchOnlineTickerTimelineEvents(watchlistTickers: string[]): Promise<MarketEvent[]> {
  const symbols = [...new Set(watchlistTickers.map((t) => t.trim().toUpperCase()).filter(Boolean))].slice(
    0,
    20,
  );
  if (symbols.length === 0) return [];

  const rows = await Promise.all(
    symbols.map(async (sym) => {
      const h = await latestHeadlineForSymbol(sym);
      return h ? toEvent(sym, h) : null;
    }),
  );

  return rows.filter((x): x is MarketEvent => x !== null);
}
