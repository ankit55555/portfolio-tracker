import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toYahooSymbol } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

type IncomingRow = {
  symbol?: unknown;
  buyPrice?: unknown;
  quantity?: unknown;
  exchange?: unknown;
  name?: unknown;
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { rows?: IncomingRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const incoming = Array.isArray(body.rows) ? body.rows : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }
  if (incoming.length > 1000) {
    return NextResponse.json(
      { error: "Too many rows (max 1000)." },
      { status: 400 }
    );
  }

  const data: {
    userId: string;
    symbol: string;
    name: string | null;
    exchange: string;
    yahooSymbol: string;
    buyPrice: number;
    quantity: number;
  }[] = [];
  let skipped = 0;

  for (const r of incoming) {
    const symbol = String(r.symbol ?? "").trim().toUpperCase();
    const buyPrice = Number(r.buyPrice);
    const quantity = Number(r.quantity);
    const exchange = r.exchange === "BSE" ? "BSE" : "NSE";
    const name = r.name ? String(r.name).trim() : null;

    if (
      !symbol ||
      !Number.isFinite(buyPrice) ||
      buyPrice <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      skipped++;
      continue;
    }

    data.push({
      userId,
      symbol,
      name,
      exchange,
      yahooSymbol: toYahooSymbol(symbol, exchange),
      buyPrice,
      quantity,
    });
  }

  if (data.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found to import." },
      { status: 400 }
    );
  }

  await prisma.holding.createMany({ data });

  return NextResponse.json({ created: data.length, skipped }, { status: 201 });
}
