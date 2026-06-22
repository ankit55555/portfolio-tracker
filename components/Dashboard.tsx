"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { HoldingRow, PortfolioTotals } from "@/lib/portfolio";
import {
  viewHoldings,
  type FilterMode,
  type SortDir,
  type SortKey,
} from "@/lib/holdingsView";
import {
  formatINR,
  formatPercent,
  formatSignedINR,
} from "@/lib/format";
import { holdingsToCsv } from "@/lib/csv";
import HoldingsTable from "@/components/HoldingsTable";
import HoldingsToolbar from "@/components/HoldingsToolbar";
import HoldingForm from "@/components/HoldingForm";
import ImportHoldings from "@/components/ImportHoldings";
import SignOutButton from "@/components/SignOutButton";

type PortfolioResponse = {
  asOf: string;
  holdings: HoldingRow[];
  totals: PortfolioTotals;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load portfolio");
    return r.json();
  });

function gainClass(value: number) {
  if (value > 0) return "text-[var(--gain)]";
  if (value < 0) return "text-[var(--loss)]";
  return "text-[var(--text)]";
}

function relativeTime(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function Dashboard({ email }: { email: string }) {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<PortfolioResponse>("/api/portfolio", fetcher, {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    });

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<HoldingRow | null>(null);

  // Sort & filter state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Re-render every 20s so the "updated Xs ago" label stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20_000);
    return () => clearInterval(id);
  }, []);

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  }

  const holdings = data?.holdings ?? [];
  const displayed = useMemo(
    () => viewHoldings(holdings, { search, filter, sortKey, sortDir }),
    [holdings, search, filter, sortKey, sortDir]
  );

  const { best, worst } = useMemo(() => {
    const live = holdings.filter((h) => h.gainPct != null);
    if (live.length === 0)
      return { best: null as HoldingRow | null, worst: null as HoldingRow | null };
    let best = live[0];
    let worst = live[0];
    for (const h of live) {
      if ((h.gainPct ?? 0) > (best.gainPct ?? 0)) best = h;
      if ((h.gainPct ?? 0) < (worst.gainPct ?? 0)) worst = h;
    }
    return { best, worst };
  }, [holdings]);

  async function handleDelete(h: HoldingRow) {
    await fetch(`/api/holdings/${h.id}`, { method: "DELETE" });
    mutate();
  }

  function handleExport() {
    const csv = holdingsToCsv(displayed.length ? displayed : holdings);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const totals = data?.totals;
  const asOf = data?.asOf ? new Date(data.asOf) : null;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Portfolio Tracker</h1>
          <Link
            href="/account"
            className="inline-block max-w-full truncate text-sm text-[var(--muted)] hover:text-[var(--accent)] hover:underline"
            title="Account settings"
          >
            {email} · Account
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 sm:w-auto"
          >
            + Add holding
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)] sm:w-auto"
          >
            Import
          </button>
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)] disabled:opacity-60 sm:w-auto"
          >
            {isValidating ? "Refreshing…" : "Refresh"}
          </button>
          <SignOutButton />
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <SummaryCard label="Invested" value={formatINR(totals?.buyValue ?? 0)} />
        <SummaryCard
          label="Current Value"
          value={formatINR(totals?.currentValue ?? 0)}
        />
        <SummaryCard
          label="Unrealised Gain"
          value={formatSignedINR(totals?.gainRs ?? 0)}
          valueClass={gainClass(totals?.gainRs ?? 0)}
          sub={`${formatPercent(totals?.gainPct ?? 0)} return`}
          subClass={gainClass(totals?.gainPct ?? 0)}
        />
        <SummaryCard
          label="Today's P&L"
          value={formatSignedINR(totals?.dayChangeRs ?? 0)}
          valueClass={gainClass(totals?.dayChangeRs ?? 0)}
          sub={formatPercent(totals?.dayChangePct ?? 0)}
          subClass={gainClass(totals?.dayChangePct ?? 0)}
        />
      </section>

      {/* Best / worst performer */}
      {best && worst && (
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:flex sm:gap-3">
          <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs text-[var(--muted)]">Top gainer</span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium">{best.symbol}</span>
              <span className="font-semibold text-[var(--gain)] tabular-nums">
                {formatPercent(best.gainPct)}
              </span>
            </span>
          </div>
          <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs text-[var(--muted)]">Top loser</span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium">{worst.symbol}</span>
              <span className="font-semibold text-[var(--loss)] tabular-nums">
                {formatPercent(worst.gainPct)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Status line */}
      <div className="flex items-center justify-between mb-2 text-xs text-[var(--muted)]">
        <span>
          {asOf
            ? `Updated ${relativeTime(asOf)} · auto-refresh 60s`
            : "Loading…"}
        </span>
        {totals && (
          <span>
            {totals.livePrices}/{totals.count} live prices
            {totals.livePrices < totals.count && " (some tickers unresolved)"}
          </span>
        )}
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-xl border border-[var(--loss)]/40 bg-[var(--surface)] p-6 text-[var(--loss)]">
          Could not load your portfolio. Try refreshing.
        </div>
      ) : isLoading ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-4 last:border-0"
            >
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-2)]" />
              <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-2)]" />
              <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface-2)]" />
              <div className="hidden h-4 w-16 animate-pulse rounded bg-[var(--surface-2)] sm:block" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {data!.holdings.length > 0 && (
            <HoldingsToolbar
              search={search}
              onSearch={setSearch}
              filter={filter}
              onFilter={setFilter}
              sortKey={sortKey}
              onSortKey={(k) => {
                setSortKey(k);
                setSortDir(k === "symbol" ? "asc" : "desc");
              }}
              sortDir={sortDir}
              onToggleDir={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              onExport={handleExport}
              shown={displayed.length}
              total={data!.holdings.length}
            />
          )}

          {data!.holdings.length > 0 && displayed.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
              No holdings match your search or filter.
            </div>
          ) : (
            <HoldingsTable
              rows={displayed}
              totalValue={totals?.currentValue ?? 0}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              onEdit={(h) => setEditing(h)}
              onDelete={handleDelete}
            />
          )}
          {totals && data!.holdings.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-x-8 gap-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
              <span className="text-[var(--muted)]">
                Total Buy:{" "}
                <span className="text-[var(--text)] font-medium tabular-nums">
                  {formatINR(totals.buyValue)}
                </span>
              </span>
              <span className="text-[var(--muted)]">
                Total Current:{" "}
                <span className="text-[var(--text)] font-medium tabular-nums">
                  {formatINR(totals.currentValue)}
                </span>
              </span>
              <span className="text-[var(--muted)]">
                Unrealised:{" "}
                <span
                  className={`font-semibold tabular-nums ${gainClass(
                    totals.gainRs
                  )}`}
                >
                  {formatSignedINR(totals.gainRs)} (
                  {formatPercent(totals.gainPct)})
                </span>
              </span>
            </div>
          )}
        </>
      )}

      {/* Add / edit modal */}
      {showAdd && (
        <HoldingForm
          onCancel={() => setShowAdd(false)}
          onDone={() => {
            setShowAdd(false);
            mutate();
          }}
        />
      )}
      {editing && (
        <HoldingForm
          holding={editing}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            mutate();
          }}
        />
      )}
      {showImport && (
        <ImportHoldings
          onCancel={() => setShowImport(false)}
          onDone={() => {
            setShowImport(false);
            mutate();
          }}
        />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
  sub,
  subClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-xs text-[var(--muted)] mb-1">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${valueClass ?? ""}`}>
        {value}
      </div>
      {sub && (
        <div className={`text-xs tabular-nums mt-0.5 ${subClass ?? "text-[var(--muted)]"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
