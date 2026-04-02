"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  newsFromYmd: string;
  newsToYmd: string;
  eventsFromYmd: string;
  eventsToYmd: string;
};

/**
 * Optional ranges for the main dashboard: upcoming timeline window and briefing published dates.
 */
export function DashboardDateToolbar({
  newsFromYmd,
  newsToYmd,
  eventsFromYmd,
  eventsToYmd,
}: Props) {
  const router = useRouter();
  const [nf, setNf] = useState(newsFromYmd);
  const [nt, setNt] = useState(newsToYmd);
  const [ef, setEf] = useState(eventsFromYmd);
  const [et, setEt] = useState(eventsToYmd);

  useEffect(() => {
    setNf(newsFromYmd);
    setNt(newsToYmd);
    setEf(eventsFromYmd);
    setEt(eventsToYmd);
  }, [newsFromYmd, newsToYmd, eventsFromYmd, eventsToYmd]);

  function apply() {
    const q = new URLSearchParams();
    q.set("newsFrom", nf);
    q.set("newsTo", nt);
    q.set("eventsFrom", ef);
    q.set("eventsTo", et);
    router.push(`/dashboard?${q.toString()}`);
  }

  function clearFilters() {
    router.push("/dashboard");
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-[var(--muted)]">Optional:</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset className="min-w-0 space-y-2 rounded-lg border border-white/10 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-white">
            Timeline (upcoming)
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-[var(--muted)]">
              From
              <input
                type="date"
                value={ef}
                onChange={(e) => setEf(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-[var(--muted)]">
              To
              <input
                type="date"
                value={et}
                onChange={(e) => setEt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
              />
            </label>
          </div>
        </fieldset>
        <fieldset className="min-w-0 space-y-2 rounded-lg border border-white/10 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-white">
            News briefing
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-[var(--muted)]">
              From
              <input
                type="date"
                value={nf}
                onChange={(e) => setNf(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-[var(--muted)]">
              To
              <input
                type="date"
                value={nt}
                onChange={(e) => setNt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
              />
            </label>
          </div>
        </fieldset>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Apply ranges
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
