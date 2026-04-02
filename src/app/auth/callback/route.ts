import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/home";
  return raw;
}

/**
 * PKCE / email-confirm links must attach session cookies to this response.
 * Using `cookies()` from `next/headers` here often does not apply Set-Cookie to the redirect,
 * so the exchange “succeeds” but the browser never stores the session — email changes look broken.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/home", url.origin));
  }

  const redirectTarget = new URL(next, url.origin);
  const response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const fail = new URL("/login", url.origin);
    fail.searchParams.set("error", "auth_callback");
    fail.searchParams.set("reason", error.message);
    return NextResponse.redirect(fail);
  }

  return response;
}
