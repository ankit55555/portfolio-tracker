// List all registered accounts (email + holdings count + created date).
// Passwords are hashed and intentionally cannot be displayed.
//   npx tsx scripts/list-users.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { holdings: true } } },
  });

  if (users.length === 0) {
    console.log("No accounts registered yet.");
    return;
  }

  console.log(`${users.length} account(s):\n`);
  for (const u of users) {
    console.log(
      `  ${u.email.padEnd(34)} ${u._count.holdings} holdings   created ${u.createdAt
        .toISOString()
        .slice(0, 10)}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
