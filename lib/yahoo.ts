// Live quotes from Yahoo Finance's public chart endpoint.
//
// We deliberately use the chart endpoint (v8/finance/chart) rather than the
// quote API: it needs no crumb/cookie handshake (which is rate-limit-prone),
// works for NSE/BSE symbols and ETFs, and URL-encodes special characters such
// as the "&" in "ARE&M.NS". Results are cached in-memory to spare Yahoo.

export type Quote = {
  symbol: string;
  price: number | null;
  currency: string | null;
  change: number | null;
  changePercent: number | null;
  shortName: string | null;
};

const TTL_MS = 60_000; // serve cached prices for up to 60s
const cache = new Map<string, { at: number; quote: Quote }>();

const HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function emptyQuote(symbol: string): Quote {
  return {
    symbol,
    price: null,
    currency: null,
    change: null,
    changePercent: null,
    shortName: null,
  };
}

type ChartMeta = {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
  shortName?: string;
  longName?: string;
};

async function fetchChart(symbol: string): Promise<ChartMeta | null> {
  const path = `/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=1d&interval=1d`;

  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        // Always hit Yahoo fresh; we do our own caching above.
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        chart?: { result?: { meta?: ChartMeta }[]; error?: unknown };
      };
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta && typeof meta.regularMarketPrice === "number") return meta;
    } catch {
      // try next host
    }
  }
  return null;
}

async function fetchOne(symbol: string): Promise<Quote> {
  const meta = await fetchChart(symbol);
  if (!meta || typeof meta.regularMarketPrice !== "number") {
    return emptyQuote(symbol);
  }

  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const change = prev != null ? price - prev : null;
  const changePercent =
    prev != null && prev !== 0 ? ((price - prev) / prev) * 100 : null;

  return {
    symbol,
    price,
    currency: meta.currency ?? null,
    change,
    changePercent,
    shortName: meta.shortName ?? meta.longName ?? null,
  };
}

/**
 * Fetch live quotes for the given Yahoo symbols (e.g. "NTPC.NS").
 * Cached in-memory for {@link TTL_MS} to avoid hammering Yahoo.
 */
export async function getQuotes(
  symbols: string[]
): Promise<Record<string, Quote>> {
  const unique = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))];
  const now = Date.now();
  const result: Record<string, Quote> = {};
  const toFetch: string[] = [];

  for (const s of unique) {
    const hit = cache.get(s);
    if (hit && now - hit.at < TTL_MS) {
      result[s] = hit.quote;
    } else {
      toFetch.push(s);
    }
  }

  const fetched = await Promise.all(toFetch.map(fetchOne));
  for (const q of fetched) {
    cache.set(q.symbol, { at: now, quote: q });
    result[q.symbol] = q;
  }

  return result;
}

/** Build a Yahoo ticker from a plain symbol + exchange (NSE -> .NS, BSE -> .BO). */
export function toYahooSymbol(symbol: string, exchange: string): string {
  const clean = symbol.trim().toUpperCase();
  if (clean.includes(".")) return clean; // already a full Yahoo symbol
  return `${clean}.${exchange === "BSE" ? "BO" : "NS"}`;
}
