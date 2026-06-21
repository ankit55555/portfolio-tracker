"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const res = await fetch("/api/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not send the code.");
      return;
    }
    setInfo(`If an account exists for ${email}, a 6-digit code is on its way.`);
    setStep(2);
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not reset password.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 outline-none focus:border-[var(--accent)]";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-1">Reset password</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          {step === 1
            ? "Enter your email and we'll send a reset code."
            : "Enter the code from your email and a new password."}
        </p>

        {done ? (
          <p className="text-sm text-[var(--gain)]">
            Password reset. Redirecting to sign in…
          </p>
        ) : step === 1 ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-[var(--muted)]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-[var(--loss)]">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            {info && <p className="text-sm text-[var(--gain)]">{info}</p>}
            <div>
              <label className="block text-sm mb-1 text-[var(--muted)]">
                6-digit code
              </label>
              <input
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputCls} tracking-[0.4em]`}
                placeholder="______"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted)]">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
                className={inputCls}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--muted)]">
                Confirm new password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
              />
            </div>
            {error && <p className="text-sm text-[var(--loss)]">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Resetting…" : "Reset password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="w-full text-sm text-[var(--muted)] hover:text-[var(--text)]"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-[var(--muted)]">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
