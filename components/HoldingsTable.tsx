"use client";

import type { HoldingRow } from "@/lib/portfolio";
import {
  formatINR,
  formatNumber,
  formatPrice,
  formatPercent,
  formatSignedINR,
} from "@/lib/format";

type Props = {
  rows: HoldingRow[];
  onEdit: (h: HoldingRow) => void;
  onDelete: (h: HoldingRow) => void;
};

function gainClass(value: number | null | undefined) {
  if (value == null) return "text-[var(--muted)]";
  if (value > 0) return "text-[var(--gain)]";
  if (value < 0) return "text-[var(--loss)]";
  return "text-[var(--muted)]";
}

export default function HoldingsTable({ rows, onEdit, onDelete }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
        No holdings yet. Click <span className="text-[var(--text)]">Add holding</span> to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium text-right">Buy Price</th>
            <th className="px-4 py-3 font-medium text-right">Qty</th>
            <th className="px-4 py-3 font-medium text-right">Buy Value</th>
            <th className="px-4 py-3 font-medium text-right">CMP</th>
            <th className="px-4 py-3 font-medium text-right">Current Value</th>
            <th className="px-4 py-3 font-medium text-right">% Gain</th>
            <th className="px-4 py-3 font-medium text-right">Gain ₹</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/40"
            >
              <td className="px-4 py-3">
                <div className="font-medium">{r.symbol}</div>
                <div className="text-xs text-[var(--muted)]">
                  {r.name ?? r.yahooSymbol}
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatPrice(r.buyPrice)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(r.quantity)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatINR(r.buyValue)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {r.live ? (
                  formatPrice(r.cmp)
                ) : (
                  <span className="text-[var(--muted)]" title="No live price">
                    —
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatINR(r.currentValue)}
              </td>
              <td
                className={`px-4 py-3 text-right tabular-nums font-medium ${gainClass(
                  r.gainPct
                )}`}
              >
                {formatPercent(r.gainPct)}
              </td>
              <td
                className={`px-4 py-3 text-right tabular-nums font-medium ${gainClass(
                  r.gainRs
                )}`}
              >
                {formatSignedINR(r.gainRs)}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  onClick={() => onEdit(r)}
                  className="text-[var(--muted)] hover:text-[var(--accent)] px-1.5"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(`Delete ${r.symbol} from your portfolio?`)
                    ) {
                      onDelete(r);
                    }
                  }}
                  className="text-[var(--muted)] hover:text-[var(--loss)] px-1.5"
                  title="Delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
