"use client";

import { useState } from "react";
import useSWR from "swr";
import type { HoldingRow, PortfolioTotals } from "@/lib/portfolio";
import {
  formatINR,
  formatPercent,
  formatSignedINR,
} from "@/lib/format";
import HoldingsTable from "@/components/HoldingsTable";
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

export default function Dashboard({ email }: { email: string }) {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<PortfolioResponse>("/api/portfolio", fetcher, {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    });

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<HoldingRow | null>(null);

  async function handleDelete(h: HoldingRow) {
    await fetch(`/api/holdings/${h.id}`, { method: "DELETE" });
    mutate();
  }

  const totals = data?.totals;
  const asOf = data?.asOf ? new Date(data.asOf) : null;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Portfolio Tracker</h1>
          <p className="truncate text-sm text-[var(--muted)]">{email}</p>
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
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Invested" value={formatINR(totals?.buyValue ?? 0)} />
        <SummaryCard
          label="Current Value"
          value={formatINR(totals?.currentValue ?? 0)}
        />
        <SummaryCard
          label="Unrealised Gain"
          value={formatSignedINR(totals?.gainRs ?? 0)}
          valueClass={gainClass(totals?.gainRs ?? 0)}
        />
        <SummaryCard
          label="Return %"
          value={formatPercent(totals?.gainPct ?? 0)}
          valueClass={gainClass(totals?.gainPct ?? 0)}
        />
      </section>

      {/* Status line */}
      <div className="flex items-center justify-between mb-2 text-xs text-[var(--muted)]">
        <span>
          {asOf
            ? `Updated ${asOf.toLocaleTimeString("en-IN")} · auto-refresh 60s`
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
          Loading holdings and live prices…
        </div>
      ) : (
        <>
          <HoldingsTable
            rows={data!.holdings}
            onEdit={(h) => setEditing(h)}
            onDelete={handleDelete}
          />
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
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-xs text-[var(--muted)] mb-1">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${valueClass ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
