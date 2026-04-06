import Link from "next/link";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a2332_0%,_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-6 text-sm text-[var(--muted)] transition hover:text-white"
        >
          ← Alpha Brief
        </Link>
        <div className="rounded-2xl border border-white/[0.12] bg-[var(--card)]/85 p-8 shadow-xl shadow-black/25 backdrop-blur-md">
          <h1 className="text-3xl font-extralight tracking-tight text-white">{title}</h1>
          {subtitle && <div className="mt-3 text-sm text-[var(--muted)]">{subtitle}</div>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
