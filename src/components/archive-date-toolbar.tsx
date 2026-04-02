"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  eventsFromYmd: string;
  eventsToYmd: string;
  newsFromYmd: string;
  newsToYmd: string;
};

export function ArchiveDateToolbar({
  eventsFromYmd,
  eventsToYmd,
  newsFromYmd,
  newsToYmd,
}: Props) {
  const router = useRouter();
  const [ef, setEf] = useState(eventsFromYmd);
  const [et, setEt] = useState(eventsToYmd);
  const [nf, setNf] = useState(newsFromYmd);
  const [nt, setNt] = useState(newsToYmd);

  useEffect(() => {
    setEf(eventsFromYmd);
    setEt(eventsToYmd);
    setNf(newsFromYmd);
    setNt(newsToYmd);
  }, [eventsFromYmd, eventsToYmd, newsFromYmd, newsToYmd]);

  function apply() {
    const q = new URLSearchParams();
    q.set("eventsFrom", ef);
    q.set("eventsTo", et);
    q.set("newsFrom", nf);
    q.set("newsTo", nt);
    router.push(`/dashboard/archive?${q.toString()}`);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-[var(--muted)]">Optional:</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset className="min-w-0 space-y-2 rounded-lg border border-white/10 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-white">
            Past timeline
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
            Archived news
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
        <Link
          href="/dashboard/archive"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Reset defaults
        </Link>
      </div>
    </div>
  );
}
