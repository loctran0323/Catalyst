import { sendTestDigest, updateDigest } from "@/app/dashboard/actions";
import { ChangePasswordWithOtp } from "@/components/change-password-with-otp";
import { requestEmailChange } from "@/app/dashboard/settings/actions";
import { createClient } from "@/lib/supabase/server";
import type { DigestFrequency } from "@/types/database";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{
    digest?: string;
    reason?: string;
    account?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("digest_frequency")
    .eq("id", user.id)
    .single();

  const current = (profile?.digest_frequency ?? "none") as DigestFrequency;

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-[var(--muted)]">
          Email digests are sent via Resend when configured. Use “Send test” to verify
          your inbox.
        </p>
      </div>

      {sp.digest === "sent" && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Test digest sent — check your inbox (and spam).
        </p>
      )}
      {sp.digest === "error" && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not send: {sp.reason ? decodeURIComponent(sp.reason) : "Unknown error"}
        </p>
      )}

      {sp.account === "email_confirm_sent" && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Confirmation email sent. Check your <strong>new</strong> inbox (and the current one if
          secure email change is on in Supabase) and click the link to finish updating your email.
        </p>
      )}
      {sp.account === "password_updated" && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Password updated. You can keep using this session; sign in with the new password next
          time.
        </p>
      )}
      {sp.account === "error" && sp.reason && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {decodeURIComponent(sp.reason)}
        </p>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Email changes use Supabase confirmation links. Password changes require a one-time code
          sent to your current email.
        </p>

        <div className="mt-6 border-t border-[var(--border)] pt-6">
          <h3 className="text-sm font-medium text-white">Email address</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Signed in as <span className="text-[var(--foreground)]">{user.email}</span>
            {user.new_email ? (
              <>
                {" "}
                · Pending confirmation for{" "}
                <span className="text-amber-200/90">{user.new_email}</span>
              </>
            ) : null}
          </p>
          <form action={requestEmailChange} className="mt-4 space-y-3">
            <div>
              <label htmlFor="new_email" className="block text-sm text-[var(--muted)]">
                New email
              </label>
              <input
                id="new_email"
                name="new_email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-white outline-none ring-[var(--accent)] placeholder:text-[var(--muted)]/50 focus:ring-2"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-muted)]"
            >
              Send confirmation to new email
            </button>
          </form>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <h3 className="text-sm font-medium text-white">Password</h3>
          <ChangePasswordWithOtp userEmail={user.email ?? ""} />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-white">Email digest</h2>
        <form action={updateDigest} className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-sm text-[var(--muted)]">Frequency</legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["none", "Off"],
                  ["daily", "Daily"],
                  ["weekly", "Weekly"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]"
                >
                  <input
                    type="radio"
                    name="digest_frequency"
                    value={value}
                    defaultChecked={current === value}
                    className="border-[var(--border)] text-[var(--accent)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-muted)]"
          >
            Save preference
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-white">Test email</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sends a one-off email with up to three news briefing headlines and three upcoming
          events to {user?.email ?? "your account email"} via Resend.
        </p>
        <form action={sendTestDigest} className="mt-4">
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
          >
            Send test digest
          </button>
        </form>
      </section>
    </div>
  );
}
