// Indian-locale number / currency formatting helpers.

const inr0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,23,456 — whole rupees, Indian digit grouping. */
export function formatINR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return inr0.format(value);
}

/** ₹1,389.12 — two decimals, for prices. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return inr2.format(value);
}

/** 1,23,456 — plain number, Indian grouping. */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return num0.format(value);
}

/** +12.34% / -5.67% */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** +₹1,234 / -₹567 — signed rupee gain. */
export function formatSignedINR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${inr0.format(Math.abs(value))}`;
}
