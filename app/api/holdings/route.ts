import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toYahooSymbol } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const name = body.name ? String(body.name).trim() : null;
  const exchange = body.exchange === "BSE" ? "BSE" : "NSE";
  const buyPrice = Number(body.buyPrice);
  const quantity = Number(body.quantity);

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required." }, { status: 400 });
  }
  if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
    return NextResponse.json(
      { error: "Buy price must be a positive number." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "Quantity must be a positive number." },
      { status: 400 }
    );
  }

  // Allow the user to pass an explicit Yahoo symbol; otherwise derive it.
  const yahooSymbol = body.yahooSymbol
    ? String(body.yahooSymbol).trim().toUpperCase()
    : toYahooSymbol(symbol, exchange);

  const holding = await prisma.holding.create({
    data: { userId, symbol, name, exchange, yahooSymbol, buyPrice, quantity },
  });

  return NextResponse.json(holding, { status: 201 });
}
