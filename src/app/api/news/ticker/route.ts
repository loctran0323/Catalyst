import { getNewsForTicker } from "@/lib/news";
import { isValidTickerSymbol, normalizeTickerSymbol } from "@/lib/ticker-symbol";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("symbol");
  const symbol = normalizeTickerSymbol(raw ?? "");
  if (!symbol || !isValidTickerSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid or missing symbol" }, { status: 400 });
  }

  const articles = await getNewsForTicker(symbol, 10);
  return NextResponse.json({ articles });
}
