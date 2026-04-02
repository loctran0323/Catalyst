import crypto from "node:crypto";
import type { NewsArticle } from "@/types/news";
import { rssGetTag } from "@/lib/rss-parse";

type SourceFeed = {
  source: string;
  url: string;
};

type RssItem = {
  title: string;
  link: string;
  pubDate: string | null;
  description: string;
  source: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Main briefing: keep RSS items published within the last N days (older items move to archive view). */
export const NEWS_VISIBLE_MAX_AGE_MS = 3 * MS_PER_DAY;

/** Archive lists exclude items newer than this (no overlap with main briefing). */
export function isPublishedBeforeArchiveCutoff(
  pubDate: string | null,
  nowMs = Date.now(),
): boolean {
  if (!pubDate) return false;
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return false;
  return nowMs - t > NEWS_VISIBLE_MAX_AGE_MS;
}

/** How far back to pull from feeds when building ranked lists (archive band uses overlap with visible). */
const NEWS_RSS_FETCH_MAX_AGE_MS = 30 * MS_PER_DAY;

function publishedWithinWindow(pubDate: string | null, maxAgeMs: number, now = Date.now()): boolean {
  if (!pubDate) return true;
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return true;
  return now - t <= maxAgeMs;
}

type NewsBrief = {
  summary: string;
  marketImpact: "bullish" | "bearish" | "neutral";
  rationale: string;
};

const FEEDS: SourceFeed[] = [
  { source: "NYT", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml" },
  { source: "Reuters", url: "https://feeds.reuters.com/reuters/businessNews" },
  { source: "Bloomberg", url: "https://feeds.bloomberg.com/markets/news.rss" },
  { source: "CNBC", url: "https://www.cnbc.com/id/10001147/device/rss/rss.html" },
  { source: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/" },
  { source: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { source: "CNN Business", url: "http://rss.cnn.com/rss/money_latest.rss" },
  { source: "Nasdaq", url: "https://www.nasdaq.com/feed/rssoutbound?category=Stocks" },
];

/** Newest N rows from the merged RSS list always qualify so briefings churn with top headlines, not only macro/ticker keyword hits. */
const TOP_MERGED_FEED_SLOTS = 28;

const MACRO_KEYWORDS = [
  "inflation",
  "cpi",
  "fed",
  "federal reserve",
  "rates",
  "treasury",
  "jobs report",
  "gdp",
  "housing",
  "home sales",
  "mortgage",
  "case-shiller",
  "nahb",
  "permits",
  "housing starts",
  "pmi",
  "jobless",
  "oil",
  "crude",
  "ecb",
  "euro zone",
  "durable goods",
];

async function buildNewsArticleList(
  tickers: string[],
  candidateCap: number,
): Promise<NewsArticle[]> {
  const feedItems = await loadFeedItems(NEWS_RSS_FETCH_MAX_AGE_MS);
  const candidates = feedItems
    .map((item, rank) => toCandidate(item, tickers, rank))
    .filter((item): item is RssItem & { matchedTicker: string | null } => item !== null)
    .slice(0, candidateCap);

  const summaries = await summarizeArticles(candidates);

  return candidates.map((item, i) => ({
    id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}`).digest("hex"),
    source: item.source,
    title: item.title,
    url: item.link,
    publishedAt: item.pubDate,
    summary: sanitizePlainText(summaries[i]?.summary ?? fallbackSummary(item), 220),
    matchedTicker: item.matchedTicker,
    category: classifyCategory(item),
    marketImpact: summaries[i]?.marketImpact ?? inferImpact(item).marketImpact,
    marketImpactRationale:
      summaries[i]?.rationale ?? inferImpact(item).rationale,
  }));
}

/** Ranked RSS rows whose pubDate falls in [from, to] before summarization (cheaper + narrower than full merge). */
async function buildNewsArticleListInPublishedRange(
  tickers: string[],
  publishedFromMs: number,
  publishedToMs: number,
  summarizeCap: number,
): Promise<NewsArticle[]> {
  const feedItems = await loadFeedItems(NEWS_RSS_FETCH_MAX_AGE_MS);
  const candidates = feedItems
    .map((item, rank) => toCandidate(item, tickers, rank))
    .filter((item): item is RssItem & { matchedTicker: string | null } => item !== null)
    .filter((item) => {
      if (!item.pubDate) return false;
      const t = Date.parse(item.pubDate);
      if (Number.isNaN(t)) return false;
      if (t < publishedFromMs || t > publishedToMs) return false;
      return isPublishedBeforeArchiveCutoff(item.pubDate);
    })
    .slice(0, Math.max(0, summarizeCap));

  const summaries = await summarizeArticles(candidates);

  return candidates.map((item, i) => ({
    id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}`).digest("hex"),
    source: item.source,
    title: item.title,
    url: item.link,
    publishedAt: item.pubDate,
    summary: sanitizePlainText(summaries[i]?.summary ?? fallbackSummary(item), 220),
    matchedTicker: item.matchedTicker,
    category: classifyCategory(item),
    marketImpact: summaries[i]?.marketImpact ?? inferImpact(item).marketImpact,
    marketImpactRationale:
      summaries[i]?.rationale ?? inferImpact(item).rationale,
  }));
}

export async function getNewsBriefing(params: {
  tickers: string[];
  limit?: number;
  /** Cap how many RSS rows are summarized (default scales with limit). Use a small value for email digests. */
  candidateCap?: number;
}): Promise<NewsArticle[]> {
  const tickers = [...new Set(params.tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  const limit = params.limit ?? 8;
  const candidateCap =
    params.candidateCap ?? Math.max(120, Math.min(200, limit * 3));

  const mapped = await buildNewsArticleList(
    tickers,
    Math.max(limit, Math.min(200, candidateCap)),
  );

  return mapped
    .filter((a) => publishedWithinWindow(a.publishedAt, NEWS_VISIBLE_MAX_AGE_MS))
    .slice(0, limit);
}

/**
 * Archive headlines in a chosen published-at window (RSS ~30d lookback). Summarization is capped
 * separately to keep OpenAI payloads bounded; raise cap when `OPENAI_API_KEY` is unset (fallback only).
 */
export async function getArchivedNewsBriefing(params: {
  tickers: string[];
  limit?: number;
  publishedFromMs: number;
  publishedToMs: number;
}): Promise<NewsArticle[]> {
  const tickers = [...new Set(params.tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  const limit = params.limit ?? 200;
  const hasAi = Boolean(process.env.OPENAI_API_KEY);
  const summarizeCap = hasAi ? Math.min(100, Math.max(limit, 40)) : Math.min(220, Math.max(limit, 60));

  const mapped = await buildNewsArticleListInPublishedRange(
    tickers,
    params.publishedFromMs,
    params.publishedToMs,
    summarizeCap,
  );

  return mapped
    .filter((a) => isPublishedBeforeArchiveCutoff(a.publishedAt))
    .sort((a, b) => toTime(b.publishedAt) - toTime(a.publishedAt))
    .slice(0, limit);
}

/**
 * Headlines focused on one ticker (Google News RSS + business feeds). Not investment advice.
 */
export async function getNewsForTicker(ticker: string, limit = 8): Promise<NewsArticle[]> {
  const t = ticker.trim().toUpperCase();
  if (!t) return [];

  const gNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${t} stock`)}&hl=en-US&gl=US&ceid=US:en`;

  const [googleItems, feedItems] = await Promise.all([
    fetchRssUrl(gNewsUrl, "Google News"),
    loadFeedItems(),
  ]);

  const fromFeeds = feedItems.filter((item) => {
    const blob = `${item.title} ${item.description}`.toLowerCase();
    const sym = t.toLowerCase();
    return (
      blob.includes(sym) ||
      blob.includes(`${sym}.`) ||
      blob.includes(`$${sym}`)
    );
  });

  const merged = dedupeByLink([...googleItems, ...fromFeeds])
    .filter((item) => publishedWithinWindow(item.pubDate, NEWS_RSS_FETCH_MAX_AGE_MS))
    .sort((a, b) => toTime(b.pubDate) - toTime(a.pubDate));

  const candidates = merged.slice(0, 14).map((item) => ({
    ...item,
    matchedTicker: t,
  }));

  const summaries = await summarizeArticles(candidates);

  const mapped = candidates.map((item, i) => ({
    id: crypto.createHash("sha1").update(`${item.link}-${item.pubDate ?? ""}-${t}`).digest("hex"),
    source: item.source,
    title: item.title,
    url: item.link,
    publishedAt: item.pubDate,
    summary: sanitizePlainText(summaries[i]?.summary ?? fallbackSummary(item), 220),
    matchedTicker: t,
    category: classifyCategory(item),
    marketImpact: summaries[i]?.marketImpact ?? inferImpact(item).marketImpact,
    marketImpactRationale:
      summaries[i]?.rationale ?? inferImpact(item).rationale,
  }));

  return mapped
    .filter((a) => publishedWithinWindow(a.publishedAt, NEWS_VISIBLE_MAX_AGE_MS))
    .slice(0, limit);
}

async function fetchRssUrl(url: string, source: string): Promise<RssItem[]> {
  try {
    /** `no-store` so `router.refresh()` on a timer actually pulls new RSS (Data Cache would ignore refresh until revalidate). */
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml, source);
  } catch {
    return [];
  }
}

function dedupeByLink(items: RssItem[]): RssItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
}

async function loadFeedItems(maxAgeMs: number = NEWS_RSS_FETCH_MAX_AGE_MS): Promise<RssItem[]> {
  const all = await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, { cache: "no-store" });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRssXml(xml, feed.source);
      } catch {
        return [];
      }
    }),
  );

  return all
    .flat()
    .filter((item) => publishedWithinWindow(item.pubDate, maxAgeMs))
    .sort((a, b) => toTime(b.pubDate) - toTime(a.pubDate));
}

function getTag(input: string, tag: string): string {
  return rssGetTag(input, tag);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Decode common HTML entities and non-breaking spaces (RSS often leaves these literal). */
function decodeHtmlEntities(s: string): string {
  const t = s.replace(/&amp;/g, "&");
  return t
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&#x0*a0;/gi, " ")
    .replace(/&ndash;|&mdash;/gi, "–")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : "";
    });
}

/** Strip embedded links, raw URLs, and tags so RSS snippets don’t overflow the UI. */
function sanitizePlainText(raw: string, maxLen = 240): string {
  if (!raw) return "";
  let s = decodeHtmlEntities(raw.trim());
  s = s.replace(/<a\s+[^>]*href=["'][^"']*["'][^>]*>[\s\S]*?<\/a>/gi, " ");
  s = stripHtml(s);
  s = s.replace(/https?:\/\/[^\s<>"')]+/gi, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > maxLen) return `${s.slice(0, maxLen - 1)}…`;
  return s;
}

function parseRssXml(xml: string, source: string): RssItem[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  return items
    .map((item) => {
      const title = sanitizePlainText(decodeXml(getTag(item, "title")), 220);
      const link = decodeXml(getTag(item, "link"));
      const description = sanitizePlainText(decodeXml(getTag(item, "description")), 280);
      const pubDateRaw = decodeXml(getTag(item, "pubDate"));
      const pubDate = pubDateRaw || null;
      if (!title || !link) return null;
      return { title, link, description, pubDate, source };
    })
    .filter((x): x is RssItem => Boolean(x));
}

function toCandidate(item: RssItem, tickers: string[], mergeRank: number) {
  const blob = `${item.title} ${item.description}`.toLowerCase();
  const matchedTicker = tickers.find((t) => blob.includes(t.toLowerCase())) ?? null;
  const isMacro = MACRO_KEYWORDS.some((k) => blob.includes(k));
  const inHeadlineWindow = mergeRank < TOP_MERGED_FEED_SLOTS;
  if (!matchedTicker && !isMacro && tickers.length > 0 && !inHeadlineWindow) {
    return null;
  }
  return { ...item, matchedTicker };
}

async function summarizeArticles(
  items: Array<RssItem & { matchedTicker: string | null }>,
): Promise<NewsBrief[]> {
  if (!items.length) return [];
  const key = process.env.OPENAI_API_KEY;
  if (!key) return items.map((item) => fallbackBrief(item));

  const input = items
    .map(
      (item, idx) =>
        `${idx + 1}. Title: ${item.title}\nDescription: ${item.description || "n/a"}\nSource: ${item.source}`,
    )
    .join("\n\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "For each headline, return one-sentence summary plus market impact recommendation. Return strict JSON object with key briefs: [{summary, marketImpact, rationale}] in same order. marketImpact must be bullish, bearish, or neutral.",
          },
          { role: "user", content: input },
        ],
      }),
      cache: "no-store",
    });

    if (!res.ok) return items.map((item) => fallbackBrief(item));
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return items.map((item) => fallbackBrief(item));
    const parsed = JSON.parse(raw) as { briefs?: NewsBrief[] };
    if (!Array.isArray(parsed.briefs)) return items.map((item) => fallbackBrief(item));
    return parsed.briefs.map((brief, idx) => normalizeBrief(brief, items[idx]));
  } catch {
    return items.map((item) => fallbackBrief(item));
  }
}

function fallbackSummary(item: Pick<RssItem, "description" | "title">): string {
  return sanitizePlainText(item.description || item.title, 220);
}

function fallbackBrief(item: Pick<RssItem, "description" | "title">): NewsBrief {
  const impact = inferImpact(item);
  return {
    summary: fallbackSummary(item),
    marketImpact: impact.marketImpact,
    rationale: impact.rationale,
  };
}

function normalizeBrief(
  brief: Partial<NewsBrief>,
  item: Pick<RssItem, "description" | "title">,
): NewsBrief {
  const fallback = fallbackBrief(item);
  const impact =
    brief.marketImpact === "bullish" ||
    brief.marketImpact === "bearish" ||
    brief.marketImpact === "neutral"
      ? brief.marketImpact
      : fallback.marketImpact;
  return {
    summary: sanitizePlainText((brief.summary ?? fallback.summary).trim(), 220),
    marketImpact: impact,
    rationale: sanitizePlainText((brief.rationale ?? fallback.rationale).trim(), 200),
  };
}

function inferImpact(item: Pick<RssItem, "description" | "title">): {
  marketImpact: "bullish" | "bearish" | "neutral";
  rationale: string;
} {
  const blob = `${item.title} ${item.description}`.toLowerCase();
  const bullishTerms = ["beats", "surge", "growth", "rally", "upgrade", "cooling inflation"];
  const bearishTerms = ["misses", "cuts", "downgrade", "selloff", "layoffs", "hot inflation"];
  const bullScore = bullishTerms.reduce((acc, t) => acc + Number(blob.includes(t)), 0);
  const bearScore = bearishTerms.reduce((acc, t) => acc + Number(blob.includes(t)), 0);
  if (bullScore > bearScore) {
    return {
      marketImpact: "bullish",
      rationale: "Tone appears risk-on; this may support equities in related sectors.",
    };
  }
  if (bearScore > bullScore) {
    return {
      marketImpact: "bearish",
      rationale: "Tone appears risk-off; this could pressure valuations near-term.",
    };
  }
  return {
    marketImpact: "neutral",
    rationale: "Likely mixed market impact until more data confirms direction.",
  };
}

function classifyCategory(
  item: Pick<RssItem, "title" | "description">,
): NewsArticle["category"] {
  const blob = `${item.title} ${item.description}`.toLowerCase();
  if (
    hasAny(blob, [
      "fed",
      "cpi",
      "inflation",
      "jobs report",
      "gdp",
      "yield",
      "housing",
      "mortgage",
      "home sales",
      "case-shiller",
    ])
  ) {
    return "economics";
  }
  if (hasAny(blob, ["consumer", "retail", "spending", "household", "walmart", "target"])) {
    return "consumers";
  }
  if (hasAny(blob, ["sec", "regulation", "policy", "white house", "tariff", "congress"])) {
    return "policy";
  }
  if (hasAny(blob, ["stocks", "bond", "treasury", "s&p", "nasdaq", "dow", "market"])) {
    return "markets";
  }
  return "companies";
}

function hasAny(blob: string, words: string[]): boolean {
  return words.some((w) => blob.includes(w));
}

function decodeXml(s: string): string {
  return decodeHtmlEntities(s);
}

function toTime(s: string | null): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}
