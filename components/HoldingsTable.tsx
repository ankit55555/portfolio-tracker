"use client";

import type { HoldingRow } from "@/lib/portfolio";
import type { SortDir, SortKey } from "@/lib/holdingsView";
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
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSort?: (k: SortKey) => void;
};

const COLUMNS: { label: string; key: SortKey; align: "left" | "right" }[] = [
  { label: "Stock", key: "symbol", align: "left" },
  { label: "Buy Price", key: "buyPrice", align: "right" },
  { label: "Qty", key: "quantity", align: "right" },
  { label: "Buy Value", key: "buyValue", align: "right" },
  { label: "CMP", key: "cmp", align: "right" },
  { label: "Current Value", key: "currentValue", align: "right" },
  { label: "% Gain", key: "gainPct", align: "right" },
  { label: "Gain ₹", key: "gainRs", align: "right" },
];

function gainClass(value: number | null | undefined) {
  if (value == null) return "text-[var(--muted)]";
  if (value > 0) return "text-[var(--gain)]";
  if (value < 0) return "text-[var(--loss)]";
  return "text-[var(--muted)]";
}

function confirmDelete(r: HoldingRow, onDelete: (h: HoldingRow) => void) {
  if (window.confirm(`Delete ${r.symbol} from your portfolio?`)) onDelete(r);
}

function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      <div className={`tabular-nums ${className}`}>{value}</div>
    </div>
  );
}

export default function HoldingsTable({
  rows,
  onEdit,
  onDelete,
  sortKey,
  sortDir,
  onSort,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
        No holdings yet. Tap{" "}
        <span className="text-[var(--text)]">Add holding</span> or{" "}
        <span className="text-[var(--text)]">Import</span> to get started.
      </div>
    );
  }

  return (
    <>
      {/* ---- Mobile: card list ---- */}
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold leading-tight">{r.symbol}</div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {r.name ?? r.yahooSymbol}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${gainClass(r.gainPct)}`}>
                  {formatPercent(r.gainPct)}
                </div>
                <div className={`text-xs ${gainClass(r.gainRs)}`}>
                  {formatSignedINR(r.gainRs)}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Invested" value={formatINR(r.buyValue)} />
              <Metric
                label="Current"
                value={formatINR(r.currentValue)}
                className="font-medium"
              />
              <Metric
                label="CMP"
                value={r.live ? formatPrice(r.cmp) : "—"}
              />
              <Metric
                label="Buy × Qty"
                value={`${formatPrice(r.buyPrice)} × ${formatNumber(r.quantity)}`}
              />
            </div>

            <div className="mt-3 flex justify-end gap-2 border-t border-[var(--border)] pt-3">
              <button
                onClick={() => onEdit(r)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
              >
                Edit
              </button>
              <button
                onClick={() => confirmDelete(r, onDelete)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--loss)] hover:border-[var(--loss)]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Desktop: table ---- */}
      <div className="hidden overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 font-medium ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {onSort ? (
                      <button
                        onClick={() => onSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-[var(--text)] ${
                          active ? "text-[var(--text)]" : ""
                        }`}
                      >
                        {col.label}
                        <span className="text-[10px] w-2">
                          {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
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
                    onClick={() => confirmDelete(r, onDelete)}
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
    </>
  );
}
