"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle } from "@/types/news";

type BriefingTabId = "all" | "tickers" | NewsArticle["category"];

const CATEGORY_TABS: Array<{ id: NewsArticle["category"]; label: string }> = [
  { id: "economics", label: "Economics" },
  { id: "markets", label: "Markets" },
  { id: "consumers", label: "Consumers" },
  { id: "companies", label: "Companies" },
  { id: "policy", label: "Policy" },
];

export function NewsBriefing({
  articles,
  itemsPerPage = 2,
  title = "News briefing",
  emptyHintTickers = "No watchlist-tagged headlines in the last few days. Add tickers or check All.",
}: {
  articles: NewsArticle[];
  itemsPerPage?: number;
  title?: string;
  /** Shown when Tickers tab is empty. */
  emptyHintTickers?: string;
}) {
  const [activeTab, setActiveTab] = useState<BriefingTabId>("all");
  const [page, setPage] = useState(0);

  const tabs = useMemo(() => {
    const all = { id: "all" as const, label: "All", count: articles.length };
    const tickers = {
      id: "tickers" as const,
      label: "Tickers",
      count: articles.filter((a) => Boolean(a.matchedTicker)).length,
    };
    const rest = CATEGORY_TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count: articles.filter((a) => !a.matchedTicker && a.category === tab.id).length,
    }));
    return [all, tickers, ...rest];
  }, [articles]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return articles;
    if (activeTab === "tickers") return articles.filter((a) => Boolean(a.matchedTicker));
    return articles.filter((a) => !a.matchedTicker && a.category === activeTab);
  }, [articles, activeTab]);

  useEffect(() => {
    setPage(0);
  }, [activeTab, articles]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const slice = useMemo(() => {
    const p = Math.min(page, pageCount - 1);
    return filtered.slice(p * itemsPerPage, p * itemsPerPage + itemsPerPage);
  }, [filtered, page, pageCount, itemsPerPage]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {filtered.length > itemsPerPage && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Previous headlines"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white transition enabled:hover:border-[var(--accent)]/50 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="More headlines"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white transition enabled:hover:border-[var(--accent)]/50 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? "rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] ring-1 ring-white/10 hover:text-white"
            }
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          {activeTab === "tickers"
            ? emptyHintTickers
            : "No matching headlines in this tab right now."}
        </p>
      ) : (
        <ul className="mt-4 grid min-w-0 gap-3">
          {slice.map((article) => (
            <li
              key={article.id}
              className="min-w-0 max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[var(--accent)]/40"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[var(--muted)]">
                  {article.source}
                </span>
                {article.matchedTicker && (
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-200">
                    {article.matchedTicker}
                  </span>
                )}
                {article.publishedAt && (
                  <span className="text-[var(--muted)]">
                    {new Date(article.publishedAt).toLocaleString()}
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[var(--muted)]">
                  {article.category}
                </span>
              </div>
              <h3 className="mt-2 line-clamp-2 break-words text-base font-semibold text-white">
                {article.title}
              </h3>
              <p className="mt-2 line-clamp-4 break-words text-sm leading-relaxed text-[var(--foreground)]">
                {article.summary}
              </p>
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  AI market recommendation
                </p>
                <p
                  className={
                    article.marketImpact === "bullish"
                      ? "mt-1 text-sm font-medium text-emerald-300"
                      : article.marketImpact === "bearish"
                        ? "mt-1 text-sm font-medium text-rose-300"
                        : "mt-1 text-sm font-medium text-amber-200"
                  }
                >
                  {article.marketImpact.toUpperCase()}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {article.marketImpactRationale}
                </p>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
              >
                Read original article
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
