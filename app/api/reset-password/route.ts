import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Self-service password reset for locked-out users. Because there's no email
// provider wired up, the reset is gated by a shared "reset key" so a stranger
// can't reset someone else's account. Falls back to AUTH_SECRET so it works
// out of the box; set a dedicated RESET_KEY env var to use a friendlier code.
export async function POST(req: Request) {
  const resetKey = process.env.RESET_KEY || process.env.AUTH_SECRET;

  let body: { email?: string; resetKey?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!resetKey || (body.resetKey ?? "") !== resetKey) {
    return NextResponse.json(
      { error: "Invalid reset key." },
      { status: 403 }
    );
  }

  const email = body.email?.toLowerCase().trim();
  const newPassword = body.newPassword ?? "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "No account found with that email." },
      { status: 404 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
