"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getRequestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestEmailChange(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login?next=/dashboard/settings");

  const raw = String(formData.get("new_email") ?? "").trim();
  const newEmail = raw.toLowerCase();
  if (!newEmail) {
    redirect(
      `/dashboard/settings?account=error&reason=${encodeURIComponent("Enter a new email address.")}`,
    );
  }
  if (newEmail === user.email.toLowerCase()) {
    redirect(
      `/dashboard/settings?account=error&reason=${encodeURIComponent("That is already your account email.")}`,
    );
  }

  const origin = await getRequestOrigin();
  if (!origin) {
    redirect(
      `/dashboard/settings?account=error&reason=${encodeURIComponent("Could not determine this site’s URL for the confirmation link.")}`,
    );
  }

  const nextPath = "/dashboard/settings?account=email_confirm_sent";
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { error } = await supabase.auth.updateUser({ email: raw.trim() }, { emailRedirectTo });
  if (error) {
    redirect(`/dashboard/settings?account=error&reason=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?account=email_confirm_sent");
}
