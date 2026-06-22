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
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {/* Search */}
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search symbol…"
        className="min-w-0 flex-1 sm:flex-none sm:w-48 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />

      {/* Gainers / Losers filter */}
      <div className="flex rounded-lg border border-[var(--border)] p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
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
      <div className="flex items-center gap-1">
        <select
          value={sortKey}
          onChange={(e) => onSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
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
      </div>

      <button
        onClick={onExport}
        className="ml-auto rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)]"
        title="Download holdings as CSV"
      >
        ⬇ Export
      </button>
      <span className="text-xs text-[var(--muted)]">
        {shown === total ? `${total} holdings` : `${shown} of ${total}`}
      </span>
    </div>
  );
}
