// Parse holdings pasted from a spreadsheet (Google Sheets / Excel paste = tab
// separated) or a CSV file. Tolerant of headers, ₹ signs, comma grouping,
// percent columns, and extra columns like "Buy Value" / "CMP" we don't need.

export type ParsedHolding = {
  symbol: string;
  buyPrice: number;
  quantity: number;
  exchange: "NSE" | "BSE";
};

export type ParseResult = {
  rows: ParsedHolding[];
  errors: { line: number; text: string; reason: string }[];
};

/** Strip ₹, commas, %, spaces → number. Returns NaN if no digits. */
function cleanNumber(s: string): number {
  if (!s) return NaN;
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (!/[0-9]/.test(cleaned)) return NaN;
  return parseFloat(cleaned);
}

function detectDelimiter(input: string): RegExp | string {
  if (input.includes("\t")) return "\t";
  if (input.includes(",")) return ",";
  return /\s{2,}/; // fall back to 2+ spaces
}

export function parseHoldings(input: string): ParseResult {
  const result: ParseResult = { rows: [], errors: [] };
  const rawLines = input.split(/\r?\n/);
  const delim = detectDelimiter(input);

  const split = (line: string) =>
    line
      .split(delim as never)
      .map((c) => c.trim());

  // Find the first non-empty line to inspect for a header.
  const firstIdx = rawLines.findIndex((l) => l.trim().length > 0);
  if (firstIdx === -1) return result;

  let symIdx = 0;
  let priceIdx = 1;
  let qtyIdx = 2;
  let exIdx = -1;
  let dataStart = firstIdx;

  const firstCells = split(rawLines[firstIdx]);
  const headerish =
    firstCells.some((c) =>
      /stock|symbol|ticker|price|qty|quantity|exchange|cost|avg/i.test(c)
    ) && Number.isNaN(cleanNumber(firstCells[1] ?? ""));

  if (headerish) {
    dataStart = firstIdx + 1;
    firstCells.forEach((c, i) => {
      const h = c.toLowerCase();
      if (/stock|symbol|ticker/.test(h)) symIdx = i;
      else if (/qty|quantity|shares|units/.test(h)) qtyIdx = i;
      else if (/exchange|exch/.test(h)) exIdx = i;
      else if (/(buy\s*price|avg|average|cost|^price$|price)/.test(h) && !/value/.test(h))
        priceIdx = i;
    });
  }

  for (let i = dataStart; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (!raw || !raw.trim()) continue;
    const cells = split(raw);

    const symbol = (cells[symIdx] ?? "").toUpperCase().replace(/\s+/g, "");
    const buyPrice = cleanNumber(cells[priceIdx] ?? "");
    const quantity = cleanNumber(cells[qtyIdx] ?? "");
    const exchange: "NSE" | "BSE" =
      exIdx >= 0 && /bse/i.test(cells[exIdx] ?? "") ? "BSE" : "NSE";

    // Skip blank / summary rows (Total, Unrealised Gain, etc. have no symbol).
    if (!symbol) continue;
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      result.errors.push({
        line: i + 1,
        text: raw.trim().slice(0, 60),
        reason: "no valid buy price",
      });
      continue;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      result.errors.push({
        line: i + 1,
        text: raw.trim().slice(0, 60),
        reason: "no valid quantity",
      });
      continue;
    }

    result.rows.push({ symbol, buyPrice, quantity, exchange });
  }

  return result;
}
