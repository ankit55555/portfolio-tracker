"use client";

import {
  SORT_OPTIONS,
  type FilterMode,
  type SortDir,
  type SortKey,
} from "@/lib/holdingsView";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  filter: FilterMode;
  onFilter: (f: FilterMode) => void;
  sortKey: SortKey;
  onSortKey: (k: SortKey) => void;
  sortDir: SortDir;
  onToggleDir: () => void;
  onExport: () => void;
  shown: number;
  total: number;
};

const FILTERS: { key: FilterMode; label: string }[] = [
  { key: "all", label: "All" },
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
];

export default function HoldingsToolbar({
  search,
  onSearch,
  filter,
  onFilter,
  sortKey,
  onSortKey,
  sortDir,
  onToggleDir,
  onExport,
  shown,
  total,
}: Props) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Search */}
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search symbol…"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] sm:w-44"
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Gainers / Losers filter */}
        <div className="flex flex-1 rounded-lg border border-[var(--border)] p-0.5 sm:flex-none">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilter(f.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm sm:flex-none ${
                filter === f.key
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => onSortKey(e.target.value as SortKey)}
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)] sm:flex-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              Sort: {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={onToggleDir}
          disabled={sortKey === "default"}
          title={sortDir === "asc" ? "Ascending" : "Descending"}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)] disabled:opacity-40"
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
        <button
          onClick={onExport}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)]"
          title="Download holdings as CSV"
        >
          ⬇ Export
        </button>
      </div>

      <span className="text-xs text-[var(--muted)] sm:ml-auto">
        {shown === total ? `${total} holdings` : `${shown} of ${total}`}
      </span>
    </div>
  );
}
