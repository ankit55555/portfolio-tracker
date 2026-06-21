"use client";

import { useState } from "react";
import type { HoldingRow } from "@/lib/portfolio";

type Props = {
  holding?: HoldingRow; // present => edit mode
  onDone: () => void;
  onCancel: () => void;
};

export default function HoldingForm({ holding, onDone, onCancel }: Props) {
  const isEdit = Boolean(holding);
  const [symbol, setSymbol] = useState(holding?.symbol ?? "");
  const [name, setName] = useState(holding?.name ?? "");
  const [exchange, setExchange] = useState(holding?.exchange ?? "NSE");
  const [buyPrice, setBuyPrice] = useState(
    holding ? String(holding.buyPrice) : ""
  );
  const [quantity, setQuantity] = useState(
    holding ? String(holding.quantity) : ""
  );
  const [yahooSymbol, setYahooSymbol] = useState(holding?.yahooSymbol ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      symbol,
      name: name || null,
      exchange,
      buyPrice: Number(buyPrice),
      quantity: Number(quantity),
      yahooSymbol: yahooSymbol || undefined,
    };

    const res = await fetch(
      isEdit ? `/api/holdings/${holding!.id}` : "/api/holdings",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save holding.");
      return;
    }
    onDone();
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 outline-none focus:border-[var(--accent)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit holding" : "Add holding"}
        </h2>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 text-[var(--muted)]">
                Symbol *
              </label>
              <input
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="NTPC"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[var(--muted)]">
                Exchange
              </label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className={inputCls}
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-[var(--muted)]">
              Name (optional)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="NTPC Ltd"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 text-[var(--muted)]">
                Buy price *
              </label>
              <input
                required
                type="number"
                step="any"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className={inputCls}
                placeholder="330"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[var(--muted)]">
                Quantity *
              </label>
              <input
                required
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputCls}
                placeholder="68"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-[var(--muted)]">
              Yahoo symbol (optional override)
            </label>
            <input
              value={yahooSymbol}
              onChange={(e) => setYahooSymbol(e.target.value.toUpperCase())}
              className={inputCls}
              placeholder="Auto: NTPC.NS"
            />
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Leave blank to auto-build from symbol + exchange. Set this for
              ETFs/odd tickers if the live price doesn&apos;t resolve.
            </p>
          </div>

          {error && <p className="text-sm text-[var(--loss)]">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add holding"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--muted)] hover:text-[var(--text)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
