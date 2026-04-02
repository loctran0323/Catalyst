import type { MarketEvent } from "@/types/database";

export function buildPastReleaseSearchQuery(event: MarketEvent): string {
  const d = new Date(event.event_date);
  const ymd = Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  const monthYear = Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { month: "long", year: "numeric" });

  const t = event.ticker?.trim();
  if (t) {
    return `${t} ${event.title} ${ymd} earnings results`.replace(/\s+/g, " ").trim();
  }
  return `${event.title} ${monthYear} economic report actual release ${ymd}`
    .replace(/\s+/g, " ")
    .trim();
}

function newsSearchFallbackUrl(query: string): string {
  return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

async function fetchTavilyFirstArticleUrl(query: string): Promise<string | null> {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "basic",
        max_results: 1,
        include_answer: false,
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ url?: string }>;
    };
    const url = data.results?.[0]?.url?.trim();
    if (url && /^https?:\/\//i.test(url)) return url;
    return null;
  } catch {
    return null;
  }
}

async function fetchGoogleNewsFirstItemLink(query: string): Promise<string | null> {
  try {
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(feedUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const xml = await res.text();
    const first = xml.match(/<item>[\s\S]*?<\/item>/i)?.[0];
    if (!first) return null;
    const linkMatch = first.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    let link = linkMatch?.[1]?.trim() ?? "";
    link = link.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    if (link && /^https?:\/\//i.test(link)) return link;
    return null;
  } catch {
    return null;
  }
}

/**
 * Best-effort URL to read about this event: Tavily top hit, else first Google News RSS link, else a Google News search for the same query.
 */
export async function fetchReadMoreUrlForEvent(event: MarketEvent): Promise<string> {
  const q = buildPastReleaseSearchQuery(event);

  const tavily = await fetchTavilyFirstArticleUrl(q);
  if (tavily) return tavily;

  const rss = await fetchGoogleNewsFirstItemLink(q);
  if (rss) return rss;

  const ym = event.event_date?.slice(0, 7) ?? "";
  if (ym.length === 7) {
    const q2 = `${event.title} ${ym} report data`;
    const rss2 = await fetchGoogleNewsFirstItemLink(q2);
    if (rss2) return rss2;
  }

  return newsSearchFallbackUrl(q);
}

export async function fetchReadMoreUrlsWithConcurrency(
  events: MarketEvent[],
  concurrency = 4,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let i = 0; i < events.length; i += concurrency) {
    const slice = events.slice(i, i + concurrency);
    const rows = await Promise.all(
      slice.map(async (e) => [e.id, await fetchReadMoreUrlForEvent(e)] as const),
    );
    for (const [id, url] of rows) out[id] = url;
  }
  return out;
}
