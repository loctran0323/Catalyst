import { Resend } from "resend";
import type { MarketEvent } from "@/types/database";
import type { NewsArticle } from "@/types/news";

const DIGEST_MAX_EVENTS = 3;
const DIGEST_MAX_NEWS = 3;

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

const digestCard =
  "margin-bottom:16px;padding:12px;border:1px solid #1f2835;border-radius:8px;background:#131820;";

/** Dark text for titles on default white email body (light grays vanish in many clients). */
const digestPageHeading = "#111827";
const digestPageMuted = "#4b5563";
const digestPageH1 =
  `font-family:system-ui,sans-serif;font-size:22px;font-weight:700;color:${digestPageHeading};margin:0 0 8px;line-height:1.25;`;
const digestPageH2 =
  `font-family:system-ui,sans-serif;font-size:17px;font-weight:600;color:${digestPageHeading};margin:28px 0 12px;line-height:1.3;`;

export function formatEventsDigestHtml(events: MarketEvent[]): string {
  if (events.length === 0) {
    return `<p style="color:${digestPageMuted};font-size:14px;">No upcoming events in your window.</p>`;
  }
  const rows = events
    .map(
      (e) => `
    <div style="${digestCard}">
      <div style="font-weight:600;color:#e8eaed;">${escapeHtml(e.title)}</div>
      <div style="color:#8b949e;font-size:13px;margin-top:4px;">
        ${escapeHtml(e.event_type)} · ${escapeHtml(e.ticker ?? "Macro")} · ${new Date(e.event_date).toLocaleString()}
      </div>
      <p style="color:#e8eaed;margin:8px 0 0;font-size:14px;">${escapeHtml(e.why_it_matters)}</p>
      <p style="color:#8b949e;margin:6px 0 0;font-size:13px;"><strong>Watch:</strong> ${escapeHtml(e.watch_for)}</p>
    </div>`,
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;">${rows}</div>`;
}

function formatNewsBriefingDigestHtml(articles: NewsArticle[]): string {
  if (articles.length === 0) {
    return `<p style="color:${digestPageMuted};font-size:14px;">No briefing headlines in the last few days.</p>`;
  }
  const rows = articles
    .map((a) => {
      const when = a.publishedAt
        ? new Date(a.publishedAt).toLocaleString()
        : "Recent";
      const tickerBit = a.matchedTicker ? ` · ${escapeHtml(a.matchedTicker)}` : "";
      const titleLink = `<a href="${escapeAttr(a.url)}" style="color:#a3c7ff;text-decoration:none;">${escapeHtml(a.title)}</a>`;
      const outlook = `${a.marketImpact}${a.marketImpactRationale ? ` — ${truncatePlain(a.marketImpactRationale, 140)}` : ""}`;
      return `
    <div style="${digestCard}">
      <div style="font-weight:600;color:#e8eaed;">${titleLink}</div>
      <div style="color:#8b949e;font-size:13px;margin-top:4px;">
        ${escapeHtml(a.source)} · ${escapeHtml(a.category)}${tickerBit} · ${escapeHtml(when)}
      </div>
      <p style="color:#e8eaed;margin:8px 0 0;font-size:14px;">${escapeHtml(a.summary)}</p>
      <p style="color:#8b949e;margin:6px 0 0;font-size:13px;"><strong>Outlook:</strong> ${escapeHtml(outlook)}</p>
    </div>`;
    })
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;">${rows}</div>`;
}

function truncatePlain(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Resend blocks non–account-owner recipients when using the default testing `from` address. */
function formatResendRecipientError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("only send testing emails") ||
    m.includes("verify a domain") ||
    m.includes("your own email address")
  ) {
    return (
      "Resend only delivers test sends from onboarding@resend.dev to your Resend login email. " +
      "To email any signed-in user, verify a domain at https://resend.com/domains and set " +
      "RESEND_FROM_EMAIL (e.g. Digest <digest@yourdomain.com>) in your environment, then redeploy."
    );
  }
  return message;
}

export async function sendDigestEmail(params: {
  to: string;
  subject: string;
  events: MarketEvent[];
  /** Same RSS briefing as the dashboard; capped inside the template. */
  articles?: NewsArticle[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY is missing on this server. If you opened the app from Vercel, add RESEND_API_KEY (and RESEND_FROM_EMAIL) in the project’s Environment Variables, then redeploy. Locally, use .env.local and restart npm run dev.",
    };
  }
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const events = params.events.slice(0, DIGEST_MAX_EVENTS);
  const articles = (params.articles ?? []).slice(0, DIGEST_MAX_NEWS);
  const newsHtml = formatNewsBriefingDigestHtml(articles);
  const eventsHtml = formatEventsDigestHtml(events);
  const body = `
<h1 style="${digestPageH1}">Your market digest</h1>
<p style="font-family:system-ui,sans-serif;color:${digestPageMuted};font-size:14px;margin:0 0 8px;line-height:1.45;">Top headlines from your news briefing, then upcoming catalysts.</p>
<h2 style="${digestPageH2}">News briefing</h2>
${newsHtml}
<h2 style="${digestPageH2}">Upcoming events</h2>
${eventsHtml}
`;
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:${digestPageHeading};">${body}</div>`,
  });
  if (error) {
    return { ok: false, error: formatResendRecipientError(error.message) };
  }
  return { ok: true };
}
