import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Home market view (need account)",
    body:
      "ETFs, indices, top movers and screeners. Sign in to save a watchlist and wire tickers into the rest of the app.",
  },
  {
    title: "Explore (guest)",
    body:
      "Macro timeline and news briefing without an account. Sign in for watchlist tagging and the full dashboard.",
  },
  {
    title: "Dashboard",
    body:
      "Watchlist, upcoming catalysts (macro + your tickers), news tabs, and ET-based “today” — main workspace after login.",
  },
  {
    title: "Market map",
    body:
      "Sector → industry treemap; click a name for headlines and a short “why it’s moving” read.",
  },
  {
    title: "News briefing",
    body:
      "RSS headlines with summaries and bullish / bearish / neutral tags (plus rationale) for faster context.",
  },
  {
    title: "Archive & settings",
    body:
      "Past timeline and headlines older than three days (no overlap with the live briefing). Settings for digest email when Resend is on.",
  },
] as const;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  let signedIn = false;
  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }
  const brandHomeHref = signedIn ? "/home" : "/";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a2332_0%,_transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6 md:py-8">
        <Link href={brandHomeHref} className="text-lg font-semibold tracking-tight text-white">
          Alpha Brief
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {configured ? (
            signedIn ? (
              <Link
                href="/home"
                className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                Home
              </Link>
            ) : (
              <>
                <Link
                  href="/explore"
                  className="text-[var(--muted)] transition hover:text-white"
                >
                  Explore
                </Link>
                <Link
                  href="/login"
                  className="text-[var(--muted)] transition hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
                >
                  Sign up
                </Link>
              </>
            )
          ) : (
            <span className="max-w-[220px] text-right text-xs leading-snug text-amber-400/90 sm:max-w-none">
              Add keys in <code className="text-amber-200/90">.env.local</code>
            </span>
          )}
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="mx-auto max-w-lg pt-4 text-center md:pt-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            Markets · timeline · news
          </p>
          <h1 className="mt-4 text-5xl font-extralight tracking-tight text-white md:text-6xl">
            Welcome
          </h1>
          <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-[var(--muted)] md:text-lg">
            Your alpha, briefly. Signal first, noise last.
          </p>

          {configured ? (
            signedIn ? (
              <div className="mx-auto mt-10 max-w-sm">
                <div className="rounded-2xl border border-white/[0.12] bg-[var(--card)]/80 p-6 shadow-xl shadow-black/20 backdrop-blur-md md:p-8">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    You&apos;re signed in
                  </p>
                  <Link
                    href="/home"
                    className="mt-4 flex min-h-[2.75rem] w-full items-center justify-center rounded-xl bg-white px-3 text-center text-sm font-semibold text-[#0c0f14] shadow-sm transition hover:bg-white/90"
                  >
                    Open home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mx-auto mt-10 max-w-sm">
                <div className="rounded-2xl border border-white/[0.12] bg-[var(--card)]/80 p-6 shadow-xl shadow-black/20 backdrop-blur-md md:p-8">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    Get started
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link
                      href="/login"
                      className="flex min-h-[2.75rem] items-center justify-center rounded-xl border border-white/25 bg-white/[0.04] px-3 text-center text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.08]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="flex min-h-[2.75rem] items-center justify-center rounded-xl bg-white px-3 text-center text-sm font-semibold text-[#0c0f14] shadow-sm transition hover:bg-white/90"
                    >
                      Sign up
                    </Link>
                  </div>
                  <p className="mt-3 text-center text-xs leading-relaxed text-[var(--muted)]">
                    New here? Sign up is free. Returning? Use Log in.
                  </p>
                </div>
                <p className="mt-8 text-center">
                  <Link
                    href="/explore"
                    className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-white/80"
                  >
                    Continue without signing in
                  </Link>
                </p>
              </div>
            )
          ) : (
            <p className="mx-auto mt-10 max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm text-amber-200/90">
              Copy <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">.env.example</code> to{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">.env.local</code> with your
              Supabase URL and anon key, then restart the dev server.
            </p>
          )}
        </div>

        <div className="mx-auto mt-16 max-w-5xl overflow-x-auto px-1 text-center">
          <p className="inline-block min-w-min whitespace-nowrap text-xs text-[var(--muted)] sm:text-sm">
            {configured && !signedIn ? (
              <>
                Feature cards below summarize what Alpha Brief does.{" "}
                <span className="text-amber-200/90">
                  Heads up: Full functionality is for signed-in users only.
                </span>
              </>
            ) : (
              <>Six things Alpha Brief does — quick tour below.</>
            )}
          </p>
        </div>
        <ul className="mx-auto mt-5 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left"
            >
              <h3 className="font-medium text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
