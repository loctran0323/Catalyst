"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordWithOtp({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "code_sent">("idle");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setInfo(null);
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep("code_sent");
    setInfo("Check your inbox for a verification code from Supabase, then enter it below.");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const token = String(fd.get("otp") ?? "").replace(/\s/g, "");
    const p1 = String(fd.get("new_password") ?? "");
    const p2 = String(fd.get("confirm_password") ?? "");
    if (!token) {
      setError("Enter the verification code from your email.");
      return;
    }
    if (p1.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (p1 !== p2) {
      setError("New password and confirmation do not match.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: vErr } = await supabase.auth.verifyOtp({
      email: userEmail,
      token,
      type: "email",
    });
    if (vErr) {
      setBusy(false);
      setError(vErr.message);
      return;
    }

    const { error: uErr } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (uErr) {
      setError(uErr.message);
      return;
    }

    router.push("/dashboard/settings?account=password_updated");
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-4">
      {step === "idle" && (
        <div>
          <p className="text-sm text-[var(--muted)]">
            We&apos;ll email a one-time code to <strong className="text-[var(--foreground)]">{userEmail}</strong>.
            After you verify, you can set a new password.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={sendCode}
            className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send verification code"}
          </button>
        </div>
      )}

      {step === "code_sent" && (
        <form onSubmit={onSubmit} className="space-y-4">
          {info && <p className="text-sm text-emerald-200/90">{info}</p>}
          <div>
            <label htmlFor="otp" className="block text-sm text-[var(--muted)]">
              Verification code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-white outline-none ring-[var(--accent)] focus:ring-2"
              placeholder="6-digit code"
            />
          </div>
          <div>
            <label htmlFor="new_password" className="block text-sm text-[var(--muted)]">
              New password
            </label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-white outline-none ring-[var(--accent)] focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm text-[var(--muted)]">
              Confirm new password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-white outline-none ring-[var(--accent)] focus:ring-2"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-muted)] disabled:opacity-50"
            >
              {busy ? "Updating…" : "Verify and update password"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("idle");
                setInfo(null);
                setError(null);
              }}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-50"
            >
              Start over
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
