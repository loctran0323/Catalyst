import Link from "next/link";

export function AppNav({
  email,
  signedIn = Boolean(email),
}: {
  email?: string;
  /** When false, show public links only (Home, Explore, Log in, Sign up). */
  signedIn?: boolean;
}) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/home" className="text-lg font-semibold text-white">
          Alpha Brief
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/home" className="text-[var(--muted)] transition hover:text-white">
            Home
          </Link>
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-[var(--muted)] transition hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/map"
                className="text-[var(--muted)] transition hover:text-white"
              >
                Map
              </Link>
              <Link
                href="/dashboard/archive"
                className="text-[var(--muted)] transition hover:text-white"
              >
                Archive
              </Link>
              <Link
                href="/dashboard/updates"
                className="text-[var(--muted)] transition hover:text-white"
              >
                Updates
              </Link>
              {email && (
                <span className="hidden text-[var(--muted)] sm:inline">{email}</span>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-[var(--muted)] transition hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/explore"
                className="text-[var(--muted)] transition hover:text-white"
              >
                Explore
              </Link>
              <Link
                href="/login?next=/home"
                className="text-[var(--muted)] transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup?next=/home"
                className="rounded-lg bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
