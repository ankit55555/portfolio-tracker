import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Default login created by the seed. Change the password after first login,
// or set SEED_EMAIL / SEED_PASSWORD env vars before running the seed.
const SEED_EMAIL = process.env.SEED_EMAIL ?? "ankitkumar@tenovia.com";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "changeme123";

function yahoo(symbol: string, exchange: "NSE" | "BSE") {
  return `${symbol}.${exchange === "BSE" ? "BO" : "NS"}`;
}

// Holdings transcribed from the existing Google Sheet (Buy Price × Qty).
// A few ETF / special tickers may need a tweak once live prices come back —
// they're all editable in the app.
const HOLDINGS: {
  symbol: string;
  exchange?: "NSE" | "BSE";
  buyPrice: number;
  quantity: number;
  name?: string;
}[] = [
  { symbol: "GODREJCP", buyPrice: 1383, quantity: 15, name: "Godrej Consumer" },
  { symbol: "NTPC", buyPrice: 330, quantity: 68, name: "NTPC" },
  { symbol: "KNRCON", buyPrice: 275, quantity: 104, name: "KNR Constructions" },
  { symbol: "TITAGARH", buyPrice: 1188, quantity: 15, name: "Titagarh Rail" },
  { symbol: "NATCOPHARM", buyPrice: 1389.12, quantity: 21, name: "Natco Pharma" },
  { symbol: "RECLTD", buyPrice: 439, quantity: 45, name: "REC Ltd" },
  { symbol: "ARE&M", buyPrice: 818, quantity: 60, name: "Amara Raja Energy" },
  { symbol: "TATASTEEL", buyPrice: 129, quantity: 100, name: "Tata Steel" },
  { symbol: "TATAPOWER", buyPrice: 288, quantity: 70, name: "Tata Power" },
  { symbol: "IOC", buyPrice: 119, quantity: 100, name: "Indian Oil" },
  { symbol: "IRCTC", buyPrice: 805, quantity: 35, name: "IRCTC" },
  { symbol: "SAIL", buyPrice: 92, quantity: 100, name: "SAIL" },
  { symbol: "HCLTECH", buyPrice: 1476, quantity: 17, name: "HCL Technologies" },
  { symbol: "SIEMENS", buyPrice: 4543, quantity: 3, name: "Siemens" },
  { symbol: "EQUITASBNK", buyPrice: 80, quantity: 60, name: "Equitas Small Fin Bank" },
  { symbol: "PFC", buyPrice: 385, quantity: 50, name: "Power Finance Corp" },
  { symbol: "ITBEES", buyPrice: 39, quantity: 250, name: "Nippon IT ETF" },
  { symbol: "GROWWEV", buyPrice: 34, quantity: 120, name: "Groww EV ETF" },
  { symbol: "GROWWDEFNC", buyPrice: 63, quantity: 100, name: "Groww Defence ETF" },
  { symbol: "TMPV", buyPrice: 475, quantity: 20, name: "TMPV" },
  { symbol: "ASTRAL", buyPrice: 1827, quantity: 17, name: "Astral Ltd" },
];

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: {},
    create: { email: SEED_EMAIL, passwordHash },
  });

  const existing = await prisma.holding.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log(
      `User ${SEED_EMAIL} already has ${existing} holdings — skipping holding seed.`
    );
  } else {
    for (const h of HOLDINGS) {
      const exchange = h.exchange ?? "NSE";
      await prisma.holding.create({
        data: {
          userId: user.id,
          symbol: h.symbol,
          name: h.name,
          exchange,
          yahooSymbol: yahoo(h.symbol, exchange),
          buyPrice: h.buyPrice,
          quantity: h.quantity,
        },
      });
    }
    console.log(`Seeded ${HOLDINGS.length} holdings for ${SEED_EMAIL}.`);
  }

  console.log("\nLogin with:");
  console.log(`  email:    ${SEED_EMAIL}`);
  console.log(`  password: ${SEED_PASSWORD}`);
  console.log("(change the password after first login)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
