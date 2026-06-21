import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendResetCode, emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

// Request a password-reset code by email. Always responds with a generic
// success so we don't reveal which emails are registered.
export async function POST(req: Request) {
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured on the server yet." },
      { status: 503 }
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // 6-digit code, stored hashed, valid 15 minutes. Clear older codes first.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetCode.deleteMany({ where: { email } });
    await prisma.passwordResetCode.create({
      data: { email, codeHash, expiresAt },
    });

    try {
      await sendResetCode(email, code);
    } catch (e) {
      console.error("Failed to send reset email:", e);
      return NextResponse.json(
        { error: "Could not send the reset email. Try again shortly." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
