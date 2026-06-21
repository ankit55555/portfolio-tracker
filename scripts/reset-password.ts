// Reset a user's password (admin tool — passwords can't be recovered, only reset).
//   npx tsx scripts/reset-password.ts <email> <newPassword>
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <newPassword>");
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  console.log(`Password reset for ${user.email}.`);
  console.log(`You can now log in with the new password.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
