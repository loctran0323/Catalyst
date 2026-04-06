import { NextResponse } from "next/server";

/**
 * Vercel Cron: protect with CRON_SECRET.
 * Full batch digests need SUPABASE_SERVICE_ROLE_KEY + listing users (extend later).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Cron disabled: set CRON_SECRET in the deployment environment." },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "RESEND_API_KEY not set. Configure Resend and prefer sendTestDigest from Settings for manual tests.",
      },
      { status: 501 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Cron received. Wire service-role user iteration + digest copy here for production digests.",
  });
}
