import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Self-service password reset for locked-out users (email + new password).
// Optional protection: if a RESET_KEY env var is set, callers must supply it;
// if it's not set (the default), resets are keyless for convenience.
export async function POST(req: Request) {
  const resetKey = process.env.RESET_KEY;

  let body: { email?: string; resetKey?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (resetKey && (body.resetKey ?? "") !== resetKey) {
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
