"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });
    setSaving(false);
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
          Set a new password for your account.
        </p>

        {done ? (
          <p className="text-sm text-[var(--gain)]">
            Password reset. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
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
              disabled={saving}
              className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Resetting…" : "Reset password"}
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
