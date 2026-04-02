"use server";

import { sendDigestEmail } from "@/lib/email";
import { fetchDashboardEvents } from "@/lib/events";
import { getNewsBriefing } from "@/lib/news";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

export async function addTicker(formData: FormData) {
  const watchlistId = String(formData.get("watchlist_id") ?? "");
  const raw = String(formData.get("ticker") ?? "");
  const ticker = normalizeTicker(raw);
  if (!watchlistId || !ticker) return;

  const supabase = await createClient();
  const { error } = await supabase.from("watchlist_items").insert({
    watchlist_id: watchlistId,
    ticker,
  });
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/home");
}

export async function removeTicker(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("watchlist_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/home");
}

export async function updateDigest(formData: FormData) {
  const frequency = String(formData.get("digest_frequency") ?? "none");
  if (!["none", "daily", "weekly"].includes(frequency)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ digest_frequency: frequency })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

export async function sendTestDigest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/dashboard/settings?digest=error&reason=no_email");
  }

  const { data: watchlists } = await supabase
    .from("watchlists")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  const wl = watchlists?.[0];
  let tickers: string[] = [];
  if (wl) {
    const { data: items } = await supabase
      .from("watchlist_items")
      .select("ticker")
      .eq("watchlist_id", wl.id);
    tickers = (items ?? []).map((i) => i.ticker);
  }

  const [events, newsArticles] = await Promise.all([
    fetchDashboardEvents(supabase, tickers),
    getNewsBriefing({ tickers, limit: 3, candidateCap: 12 }),
  ]);
  const result = await sendDigestEmail({
    to: user.email,
    subject: "[Catalyst] Test digest — briefing & upcoming events",
    events,
    articles: newsArticles,
  });

  if (!result.ok) {
    redirect(
      `/dashboard/settings?digest=error&reason=${encodeURIComponent(result.error)}`,
    );
  }
  redirect("/dashboard/settings?digest=sent");
}
