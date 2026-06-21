import { Resend } from "resend";

// Sender. With a fresh Resend account (no verified domain) you can only send
// from onboarding@resend.dev and only to your own Resend signup address.
// Verify a domain in Resend to send from your own address to anyone.
const FROM =
  process.env.RESET_EMAIL_FROM || "Portfolio Tracker <onboarding@resend.dev>";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendResetCode(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Portfolio Tracker password reset code",
    text: `Your password reset code is ${code}.\n\nIt expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px">
        <h2>Password reset</h2>
        <p>Your reset code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
        <p style="color:#666">It expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>`,
  });

  if (error) throw new Error(typeof error === "string" ? error : error.message);
}
