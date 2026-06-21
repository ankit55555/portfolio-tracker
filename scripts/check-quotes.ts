// Diagnostic: fetch live prices for every holding's Yahoo symbol and print
// which ones resolve. Run with:  npx tsx scripts/check-quotes.ts
import { PrismaClient } from "@prisma/client";
import { getQuotes } from "../lib/yahoo";

const prisma = new PrismaClient();

async function main() {
  const holdings = await prisma.holding.findMany({ orderBy: { createdAt: "asc" } });
  const symbols = holdings.map((h) => h.yahooSymbol);
  const quotes = await getQuotes(symbols);

  let ok = 0;
  for (const h of holdings) {
    const q = quotes[h.yahooSymbol];
    const price = q?.price ?? null;
    if (price != null) ok++;
    const status = price != null ? `₹${price}` : "—  NO PRICE";
    console.log(
      `${(price != null ? "✓" : "✗")}  ${h.symbol.padEnd(12)} ${h.yahooSymbol.padEnd(16)} ${status}`
    );
  }
  console.log(`\n${ok}/${holdings.length} tickers resolved a live price.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
