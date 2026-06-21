import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toYahooSymbol } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function requireOwnedHolding(id: string, userId: string) {
  const holding = await prisma.holding.findUnique({ where: { id } });
  if (!holding || holding.userId !== userId) return null;
  return holding;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await requireOwnedHolding(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.symbol !== undefined) {
    const symbol = String(body.symbol).trim().toUpperCase();
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required." }, { status: 400 });
    }
    data.symbol = symbol;
  }
  if (body.name !== undefined) {
    data.name = body.name ? String(body.name).trim() : null;
  }
  if (body.exchange !== undefined) {
    data.exchange = body.exchange === "BSE" ? "BSE" : "NSE";
  }
  if (body.buyPrice !== undefined) {
    const buyPrice = Number(body.buyPrice);
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      return NextResponse.json(
        { error: "Buy price must be a positive number." },
        { status: 400 }
      );
    }
    data.buyPrice = buyPrice;
  }
  if (body.quantity !== undefined) {
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number." },
        { status: 400 }
      );
    }
    data.quantity = quantity;
  }

  if (body.yahooSymbol !== undefined && body.yahooSymbol) {
    data.yahooSymbol = String(body.yahooSymbol).trim().toUpperCase();
  } else if (data.symbol || data.exchange) {
    // Keep the Yahoo symbol in sync when symbol/exchange change and no
    // explicit override was supplied.
    const symbol = (data.symbol as string) ?? existing.symbol;
    const exchange = (data.exchange as string) ?? existing.exchange;
    data.yahooSymbol = toYahooSymbol(symbol, exchange);
  }

  const updated = await prisma.holding.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await requireOwnedHolding(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.holding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
