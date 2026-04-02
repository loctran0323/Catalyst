import crypto from "node:crypto";
import type { MarketEvent } from "@/types/database";

type MacroTemplate = {
  /** Days after “today” (UTC) for the next occurrence window */
  offsetDays: number;
  title: string;
  why_it_matters: string;
  watch_for: string;
};

/**
 * Rolling macro + housing calendar (approximate spacing). Refreshes as dates roll forward.
 * Merged with DB `market_events`; deduped by title + calendar day.
 */
const MACRO_TEMPLATES: MacroTemplate[] = [
  {
    offsetDays: 2,
    title: "Building permits & housing starts",
    why_it_matters:
      "Residential construction pipeline feeds GDP expectations and rate-sensitive sectors (builders, materials, banks).",
    watch_for: "Single vs. multi-family mix, revisions to prior month, and regional strength.",
  },
  {
    offsetDays: 4,
    title: "Case-Shiller home price index",
    why_it_matters:
      "Home prices shape wealth effects, shelter inflation debates, and consumer confidence.",
    watch_for: "20-city vs. national, year-over-year pace, and divergence across metros.",
  },
  {
    offsetDays: 6,
    title: "New home sales",
    why_it_matters:
      "Forward-looking demand for new builds; moves homebuilder and mortgage sentiment.",
    watch_for: "Median price, inventory months-supply, and regional sales mix.",
  },
  {
    offsetDays: 8,
    title: "Existing home sales",
    why_it_matters:
      "Largest housing volume; liquidity in resale market affects consumer spending and rates narrative.",
    watch_for: "Sales pace vs. expectations, days on market, and price trends.",
  },
  {
    offsetDays: 10,
    title: "NAHB housing market index",
    why_it_matters:
      "Builder confidence is an early read on permits, starts, and employment in construction.",
    watch_for: "Present sales vs. expectations components; regional diffusion.",
  },
  {
    offsetDays: 12,
    title: "CPI (headline)",
    why_it_matters:
      "Inflation path drives Fed expectations, real yields, and style rotation (growth vs. value).",
    watch_for: "Core vs. headline, shelter, services, and revisions.",
  },
  {
    offsetDays: 14,
    title: "PCE price index",
    why_it_matters:
      "Fed’s preferred inflation gauge; shifts rate-cut/pricing for risk assets.",
    watch_for: "Core PCE, supercore services, and month-over-month momentum.",
  },
  {
    offsetDays: 16,
    title: "FOMC rate decision",
    why_it_matters:
      "Policy path reprices equities, USD, and credit spreads in hours.",
    watch_for: "Statement tone, dot plot, and press conference guidance.",
  },
  {
    offsetDays: 18,
    title: "Nonfarm payrolls",
    why_it_matters:
      "Labor market strength feeds Fed reaction function and cyclical equity leadership.",
    watch_for: "Revisions, participation, wages, and household vs. establishment signals.",
  },
  {
    offsetDays: 20,
    title: "Retail sales",
    why_it_matters:
      "Consumer demand pulse for discretionary names and GDP nowcasts.",
    watch_for: "Control group, autos/gasoline strip, and e-commerce share.",
  },
  {
    offsetDays: 22,
    title: "GDP (advance)",
    why_it_matters:
      "Growth surprise moves rates and cyclical vs. defensive sector performance.",
    watch_for: "Consumption vs. investment mix, inventories, and net exports.",
  },
  {
    offsetDays: 24,
    title: "UMich consumer sentiment",
    why_it_matters:
      "Expectations channel for spending; inflation expectations feed rates narrative.",
    watch_for: "Current conditions vs. expectations, and 5–10y inflation expectations.",
  },
  {
    offsetDays: 26,
    title: "Initial jobless claims",
    why_it_matters:
      "High-frequency labor stress signal; spikes can move Fed cut odds and cyclical stocks.",
    watch_for: "Continuing claims trend, seasonal noise, and revisions to prior week.",
  },
  {
    offsetDays: 28,
    title: "ISM manufacturing PMI",
    why_it_matters:
      "Factory orders and employment subindexes hint at industrial cycle and capex.",
    watch_for: "New orders vs. inventories, prices paid, and export orders.",
  },
  {
    offsetDays: 30,
    title: "EIA crude oil inventories",
    why_it_matters:
      "Weekly balances move energy equities and inflation expectations tied to fuel costs.",
    watch_for: "Gasoline/distillate builds, SPR commentary, and implied demand.",
  },
  {
    offsetDays: 32,
    title: "Conference Board consumer confidence",
    why_it_matters:
      "Labor differential and expectations feed discretionary spending narratives.",
    watch_for: "Present situation vs. expectations gap and jobs plentiful spread.",
  },
  {
    offsetDays: 34,
    title: "Durable goods orders",
    why_it_matters:
      "Capex proxy for manufacturing and transport; volatility from aircraft line items.",
    watch_for: "Ex-transportation core, nondefense cap ex, and prior-month revisions.",
  },
  {
    offsetDays: 36,
    title: "ECB policy decision (watch)",
    why_it_matters:
      "Euro rates and FX spill into U.S. multinationals, credit spreads, and risk appetite.",
    watch_for: "Deposit rate, forward guidance, and Lagarde press tone vs. Fed path.",
  },
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getSyntheticMacroTimeline(now = new Date()): MarketEvent[] {
  const base = new Date(now);
  base.setUTCHours(14, 0, 0, 0);

  return MACRO_TEMPLATES.map((row) => {
    const eventDate = new Date(base);
    eventDate.setUTCDate(eventDate.getUTCDate() + row.offsetDays);
    const day = eventDate.toISOString().slice(0, 10);
    const id = crypto
      .createHash("sha1")
      .update(`macro-${slug(row.title)}-${day}`)
      .digest("hex")
      .slice(0, 32);
    return {
      id: `syn-${id}`,
      ticker: null,
      title: row.title,
      event_type: "macro" as const,
      event_date: eventDate.toISOString(),
      why_it_matters: row.why_it_matters,
      watch_for: row.watch_for,
      created_at: now.toISOString(),
    };
  });
}

/**
 * Rolling “recent past” macro placeholders (mirrors future offsets backward) so the archive
 * timeline is not empty when the DB has no historical rows.
 */
export function getSyntheticMacroTimelinePast(now = new Date(), maxDaysBack = 40): MarketEvent[] {
  const base = new Date(now);
  base.setUTCHours(14, 0, 0, 0);
  const nowMs = now.getTime();
  const maxAgeMs = maxDaysBack * 24 * 60 * 60 * 1000;
  const out: MarketEvent[] = [];

  for (const row of MACRO_TEMPLATES) {
    const eventDate = new Date(base);
    eventDate.setUTCDate(eventDate.getUTCDate() - row.offsetDays);
    const t = eventDate.getTime();
    if (Number.isNaN(t) || t >= nowMs) continue;
    if (nowMs - t > maxAgeMs) continue;

    const day = eventDate.toISOString().slice(0, 10);
    const id = crypto
      .createHash("sha1")
      .update(`macro-past-${slug(row.title)}-${day}`)
      .digest("hex")
      .slice(0, 32);
    out.push({
      id: `syn-past-${id}`,
      ticker: null,
      title: row.title,
      event_type: "macro",
      event_date: eventDate.toISOString(),
      why_it_matters: row.why_it_matters,
      watch_for: row.watch_for,
      created_at: now.toISOString(),
    });
  }

  return out;
}

export function mergeTimelineEvents(
  dbEvents: MarketEvent[],
  synthetic: MarketEvent[],
): MarketEvent[] {
  const byKey = new Map<string, MarketEvent>();

  const keyOf = (e: MarketEvent) =>
    `${e.title.toLowerCase().slice(0, 80)}|${e.event_date.slice(0, 10)}`;

  for (const e of dbEvents) {
    byKey.set(keyOf(e), e);
  }
  for (const e of synthetic) {
    if (!byKey.has(keyOf(e))) {
      byKey.set(keyOf(e), e);
    }
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
  );
}
