"use client";

import { useMemo, useState } from "react";
import { parseHoldings } from "@/lib/parseHoldings";
import { formatPrice, formatNumber } from "@/lib/format";

type Props = {
  onDone: (created: number) => void;
  onCancel: () => void;
};

const SAMPLE = `Stock\tBuy Price\tQty
NTPC\t330\t68
TATASTEEL\t129\t100
IRCTC\t805\t35`;

export default function ImportHoldings({ onDone, onCancel }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parseHoldings(text), [text]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
  }

  async function onImport() {
    setError(null);
    if (parsed.rows.length === 0) {
      setError("Nothing to import — paste rows or upload a CSV first.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/holdings/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: parsed.rows }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Import failed.");
      return;
    }
    const data = await res.json();
    onDone(data.created ?? parsed.rows.length);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-1">Import holdings</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Copy rows from your Google Sheet (columns{" "}
          <span className="text-[var(--text)]">Stock · Buy Price · Qty</span>) and
          paste below — or upload a CSV. Extra columns and the header row are
          handled automatically.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={SAMPLE}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--accent)] resize-y"
        />

        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <label className="text-sm text-[var(--accent)] hover:underline cursor-pointer">
            Upload a CSV file instead
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={onFile}
              className="hidden"
            />
          </label>
          {text.trim() && (
            <span className="text-xs text-[var(--muted)]">
              {parsed.rows.length} valid row{parsed.rows.length === 1 ? "" : "s"}
              {parsed.errors.length > 0 &&
                ` · ${parsed.errors.length} skipped`}
            </span>
          )}
        </div>

        {/* Preview */}
        {parsed.rows.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--surface-2)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Symbol</th>
                  <th className="px-3 py-2 text-left font-medium">Exch</th>
                  <th className="px-3 py-2 text-right font-medium">Buy Price</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="px-3 py-1.5 font-medium">{r.symbol}</td>
                    <td className="px-3 py-1.5 text-[var(--muted)]">
                      {r.exchange}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatPrice(r.buyPrice)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatNumber(r.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {parsed.errors.length > 0 && (
          <details className="mt-2 text-xs text-[var(--muted)]">
            <summary className="cursor-pointer">
              {parsed.errors.length} row(s) skipped (click to see why)
            </summary>
            <ul className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
              {parsed.errors.slice(0, 20).map((e, i) => (
                <li key={i}>
                  line {e.line}: {e.reason} — <code>{e.text}</code>
                </li>
              ))}
            </ul>
          </details>
        )}

        {error && <p className="mt-3 text-sm text-[var(--loss)]">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onImport}
            disabled={saving || parsed.rows.length === 0}
            className="flex-1 rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? "Importing…"
              : `Import ${parsed.rows.length || ""} holding${
                  parsed.rows.length === 1 ? "" : "s"
                }`.trim()}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--muted)] hover:text-[var(--text)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
