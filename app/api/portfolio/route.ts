import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotes } from "@/lib/yahoo";
import { computeRow, computeTotals } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const holdings = await prisma.holding.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const quotes = await getQuotes(holdings.map((h) => h.yahooSymbol));
  const rows = holdings.map((h) => computeRow(h, quotes[h.yahooSymbol]));
  const totals = computeTotals(rows);

  return NextResponse.json({
    asOf: new Date().toISOString(),
    holdings: rows,
    totals,
  });
}
