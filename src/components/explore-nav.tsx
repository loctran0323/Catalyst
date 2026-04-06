import Link from "next/link";

export function ExploreNav() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Alpha Brief
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
          <Link href="/explore" className="text-white">
            Explore
          </Link>
          <Link
            href="/explore/map"
            className="text-[var(--muted)] transition hover:text-white"
          >
            Map
          </Link>
          <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden />
          <Link href="/login" className="text-[var(--muted)] transition hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 font-medium text-white hover:bg-[var(--accent-muted)]"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
