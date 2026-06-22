import type { HoldingRow } from "@/lib/portfolio";

function cell(v: string | number): string {
  const s = String(v);
  // Quote if the value contains a comma, quote, or newline.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Export holdings as CSV. The first three columns (Stock, Buy Price, Qty)
 * match what the Import feature reads, so an export round-trips back in.
 */
export function holdingsToCsv(rows: HoldingRow[]): string {
  const header = [
    "Stock",
    "Buy Price",
    "Qty",
    "Exchange",
    "Buy Value",
    "CMP",
    "Current Value",
    "% Gain",
    "Gain Rs",
  ];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push(
      [
        r.symbol,
        r.buyPrice,
        r.quantity,
        r.exchange,
        Math.round(r.buyValue),
        r.cmp ?? "",
        r.currentValue != null ? Math.round(r.currentValue) : "",
        r.gainPct != null ? r.gainPct.toFixed(2) : "",
        r.gainRs != null ? Math.round(r.gainRs) : "",
      ]
        .map(cell)
        .join(",")
    );
  }

  return lines.join("\n");
}
