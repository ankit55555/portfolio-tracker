"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (newPassword !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not change password.");
      return;
    }
    setDone(true);
    setCurrent("");
    setNew("");
    setConfirm("");
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 outline-none focus:border-[var(--accent)]";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1 text-[var(--muted)]">
          Current password
        </label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputCls}
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
      {done && (
        <p className="text-sm text-[var(--gain)]">Password changed. ✓</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
