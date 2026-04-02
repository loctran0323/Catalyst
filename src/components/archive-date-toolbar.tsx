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

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-inner focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25";

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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">Date ranges</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Narrow events and news independently, then apply.
        </p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Past timeline</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[var(--faint)]">
              From
              <input type="date" value={ef} onChange={(e) => setEf(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-[var(--faint)]">
              To
              <input type="date" value={et} onChange={(e) => setEt(e.target.value)} className={inputClass} />
            </label>
          </div>
        </div>
        <div className="min-w-0 space-y-3 sm:border-l sm:border-[var(--border)] sm:pl-10">
          <p className="text-sm font-semibold text-[var(--foreground)]">Archived news</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[var(--faint)]">
              From
              <input type="date" value={nf} onChange={(e) => setNf(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-[var(--faint)]">
              To
              <input type="date" value={nt} onChange={(e) => setNt(e.target.value)} className={inputClass} />
            </label>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0b1220] transition hover:bg-[var(--accent-muted)]"
        >
          Apply ranges
        </button>
        <Link
          href="/dashboard/archive"
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-muted)]"
        >
          Reset defaults
        </Link>
      </div>
    </div>
  );
}
