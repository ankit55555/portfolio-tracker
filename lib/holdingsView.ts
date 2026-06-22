import type { HoldingRow } from "@/lib/portfolio";

export type SortKey =
  | "default"
  | "symbol"
  | "buyPrice"
  | "quantity"
  | "buyValue"
  | "cmp"
  | "currentValue"
  | "gainPct"
  | "gainRs";

export type SortDir = "asc" | "desc";
export type FilterMode = "all" | "gainers" | "losers";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default order" },
  { key: "gainPct", label: "Gain %" },
  { key: "gainRs", label: "Gain ₹" },
  { key: "currentValue", label: "Current value" },
  { key: "buyValue", label: "Invested" },
  { key: "cmp", label: "CMP" },
  { key: "buyPrice", label: "Buy price" },
  { key: "quantity", label: "Quantity" },
  { key: "symbol", label: "Name (A–Z)" },
];

function cmpNullable(a: number | null, b: number | null, sign: number) {
  // Holdings without a live price sort to the bottom regardless of direction.
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return sign * (a - b);
}

export function viewHoldings(
  rows: HoldingRow[],
  opts: {
    search: string;
    filter: FilterMode;
    sortKey: SortKey;
    sortDir: SortDir;
  }
): HoldingRow[] {
  const q = opts.search.trim().toLowerCase();

  let out = rows.filter((r) => {
    if (q && !`${r.symbol} ${r.name ?? ""}`.toLowerCase().includes(q)) {
      return false;
    }
    if (opts.filter === "gainers") return (r.gainRs ?? 0) > 0;
    if (opts.filter === "losers") return (r.gainRs ?? 0) < 0;
    return true;
  });

  if (opts.sortKey !== "default") {
    const sign = opts.sortDir === "asc" ? 1 : -1;
    const key = opts.sortKey;
    out = [...out].sort((a, b) => {
      if (key === "symbol") return sign * a.symbol.localeCompare(b.symbol);
      return cmpNullable(
        a[key] as number | null,
        b[key] as number | null,
        sign
      );
    });
  }

  return out;
}
