import type { Quote } from "@/lib/yahoo";

export type HoldingRecord = {
  id: string;
  symbol: string;
  name: string | null;
  exchange: string;
  yahooSymbol: string;
  buyPrice: number;
  quantity: number;
};

export type HoldingRow = HoldingRecord & {
  buyValue: number;
  cmp: number | null;
  currentValue: number | null;
  gainRs: number | null;
  gainPct: number | null;
  dayChangePct: number | null;
  live: boolean;
};

export type PortfolioTotals = {
  buyValue: number;
  currentValue: number;
  gainRs: number;
  gainPct: number;
  count: number;
  livePrices: number;
};

/** Combine a stored holding with a live quote into a fully computed row. */
export function computeRow(h: HoldingRecord, quote?: Quote): HoldingRow {
  const buyValue = h.buyPrice * h.quantity;
  const cmp = quote?.price ?? null;
  const live = cmp != null;
  const currentValue = live ? cmp * h.quantity : null;
  const gainRs = currentValue != null ? currentValue - buyValue : null;
  const gainPct =
    gainRs != null && buyValue !== 0 ? (gainRs / buyValue) * 100 : null;

  return {
    ...h,
    buyValue,
    cmp,
    currentValue,
    gainRs,
    gainPct,
    dayChangePct: quote?.changePercent ?? null,
    live,
  };
}

/** Sum a set of computed rows into portfolio totals. Falls back to buy value
 *  for any holding without a live price so totals stay consistent. */
export function computeTotals(rows: HoldingRow[]): PortfolioTotals {
  let buyValue = 0;
  let currentValue = 0;
  let livePrices = 0;

  for (const r of rows) {
    buyValue += r.buyValue;
    currentValue += r.currentValue ?? r.buyValue;
    if (r.live) livePrices += 1;
  }

  const gainRs = currentValue - buyValue;
  const gainPct = buyValue !== 0 ? (gainRs / buyValue) * 100 : 0;

  return {
    buyValue,
    currentValue,
    gainRs,
    gainPct,
    count: rows.length,
    livePrices,
  };
}
