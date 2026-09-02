import { useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Inbox,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/telecom";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  className?: string;
  value?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
}

export interface Filter {
  key: string;
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  exportName?: string;
  pageSize?: number;
  filters?: Filter[];
  loading?: boolean;
  emptyLabel?: string;
  dense?: boolean;
  toolbarExtra?: ReactNode;
}

const cellValue = <T,>(row: T, col: Column<T>): string | number =>
  col.value ? col.value(row) : ((row as Record<string, unknown>)[col.key] as string | number) ?? "";

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search records…",
  onRowClick,
  exportName = "export",
  pageSize = 10,
  filters,
  loading,
  emptyLabel = "No records match the current filters.",
  dense,
  toolbarExtra,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);

  const visibleColumns = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = data;
    if (q) {
      rows = rows.filter((r) =>
        columns.some((c) => String(cellValue(r, c)).toLowerCase().includes(q)),
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const av = cellValue(a, col);
          const bv = cellValue(b, col);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv), undefined, { numeric: true });
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return rows;
  }, [data, query, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const handleExport = () => {
    downloadCsv(
      exportName,
      filtered.map((r) =>
        Object.fromEntries(visibleColumns.map((c) => [c.header, cellValue(r, c)])),
      ),
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 w-full rounded-xl border border-border bg-surface-2/70 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {filters?.map((f) => (
          <div key={f.key} className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              aria-label={f.label}
              value={f.value}
              onChange={(e) => {
                f.onChange(e.target.value);
                setPage(0);
              }}
              className="h-9 appearance-none rounded-xl border border-border bg-surface-2/70 pr-7 pl-8 text-xs font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
            >
              <option value="">{f.label}: All</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        ))}

        {toolbarExtra}

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-3 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary">
            <Columns3 className="size-3.5" /> Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            {columns.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.key}
                checked={!hidden.includes(c.key)}
                onCheckedChange={(v) =>
                  setHidden((h) => (v ? h.filter((k) => k !== c.key) : [...h, c.key]))
                }
              >
                {c.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={handleExport}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-3 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Download className="size-3.5" /> Export
        </button>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="glass">
              {visibleColumns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      "border-b border-border px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest whitespace-nowrap text-muted-foreground uppercase",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                    )}
                  >
                    {c.sortable === false ? (
                      c.header
                    ) : (
                      <button
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                          active && "text-primary",
                        )}
                        onClick={() =>
                          setSort((s) =>
                            s?.key === c.key
                              ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
                              : { key: c.key, dir: "asc" },
                          )
                        }
                      >
                        {c.header}
                        {active &&
                          (sort!.dir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          ))}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {visibleColumns.map((c) => (
                    <td key={c.key} className="border-b border-border/60 px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              rows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={cn(
                    "border-b border-border/60 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-primary/6 focus-visible:bg-primary/10 focus-visible:outline-none",
                  )}
                >
                  {visibleColumns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        dense ? "px-4 py-2" : "px-4 py-3",
                        "align-middle whitespace-nowrap",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row) : String(cellValue(row, c))}
                    </td>
                  ))}
                </motion.tr>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Inbox className="size-7 text-muted-foreground" />
                    <p className="text-sm font-medium">Nothing to show</p>
                    <p className="max-w-sm text-xs text-muted-foreground">{emptyLabel}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3">
        <p className="num min-w-0 truncate text-xs text-muted-foreground">
          {filtered.length} records · page {current + 1} of {pageCount}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            aria-label="Previous page"
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="grid size-8 place-items-center rounded-lg border border-border bg-surface-2/70 transition-colors hover:border-primary/50 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            aria-label="Next page"
            onClick={() => setPage(Math.min(pageCount - 1, current + 1))}
            disabled={current >= pageCount - 1}
            className="grid size-8 place-items-center rounded-lg border border-border bg-surface-2/70 transition-colors hover:border-primary/50 disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
