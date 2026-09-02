import { useMemo, useState } from "react";
import { ChevronDown, FilterX, SlidersHorizontal } from "lucide-react";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusChip } from "@/components/intel/StatusChip";
import { FACETS, type IntelFilters, type RangeFilters } from "@/lib/intel";
import { cn } from "@/lib/utils";

export function FilterPanel({
  filters,
  setFilters,
  range,
  setRange,
  matched,
  total,
}: {
  filters: IntelFilters;
  setFilters: (f: IntelFilters) => void;
  range: RangeFilters;
  setRange: (r: RangeFilters) => void;
  matched: number;
  total: number;
}) {
  const [open, setOpen] = useState(true);
  const groups = useMemo(() => {
    const g = new Map<string, typeof FACETS>();
    FACETS.forEach((f) => g.set(f.group, [...(g.get(f.group) ?? []), f]));
    return Array.from(g.entries());
  }, []);

  const activeCount =
    Object.values(filters).reduce((a, v) => a + (v?.length ?? 0), 0) +
    (range.minAmount != null ? 1 : 0) +
    (range.maxAmount != null ? 1 : 0) +
    (range.fromDate ? 1 : 0) +
    (range.toDate ? 1 : 0);

  const toggle = (key: string, option: string) => {
    const cur = filters[key] ?? [];
    const next = cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option];
    setFilters({ ...filters, [key]: next });
  };

  return (
    <Panel className="mb-6 overflow-hidden">
      <PanelHeader
        title="Intelligence segregation panel"
        subtitle={`${matched.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} suspect records match the active parameters`}
        icon={<SlidersHorizontal className="size-4" />}
        actions={
          <div className="flex items-center gap-2">
            <StatusChip tone={activeCount ? "info" : "neutral"}>{activeCount} filters</StatusChip>
            <button
              onClick={() => {
                setFilters({});
                setRange({});
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-3 text-xs font-medium hover:border-primary/50 hover:text-primary"
            >
              <FilterX className="size-3.5" /> Reset
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-3 text-xs font-medium hover:border-primary/50 hover:text-primary"
            >
              <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
              {open ? "Hide" : "Show"}
            </button>
          </div>
        }
      />

      {open && (
        <div className="space-y-4 px-5 py-4">
          {groups.map(([group, facets]) => (
            <div key={group}>
              <div className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{group}</div>
              <div className="flex flex-wrap gap-2">
                {facets.map((f) => {
                  const selected = filters[f.key] ?? [];
                  return (
                    <Popover key={f.key}>
                      <PopoverTrigger
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors",
                          selected.length
                            ? "border-primary/60 bg-primary/12 text-primary"
                            : "border-border bg-surface-2/70 hover:border-primary/40",
                        )}
                      >
                        {f.label}
                        {selected.length > 0 && <span className="num">· {selected.length}</span>}
                        <ChevronDown className="size-3" />
                      </PopoverTrigger>
                      <PopoverContent align="start" className="max-h-72 w-64 overflow-y-auto p-2">
                        <div className="mb-1 px-1 text-[10px] tracking-widest text-muted-foreground uppercase">
                          {f.label}
                        </div>
                        {f.options.map((o) => (
                          <label
                            key={o}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-2"
                          >
                            <input
                              type="checkbox"
                              className="accent-[var(--primary)]"
                              checked={selected.includes(o)}
                              onChange={() => toggle(f.key, o)}
                            />
                            <span className="truncate">{o}</span>
                          </label>
                        ))}
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <div className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Amount & timeline
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <NumField
                label="Min amount (₹ L)"
                value={range.minAmount}
                onChange={(v) => setRange({ ...range, minAmount: v })}
              />
              <NumField
                label="Max amount (₹ L)"
                value={range.maxAmount}
                onChange={(v) => setRange({ ...range, maxAmount: v })}
              />
              <DateField
                label="From date"
                value={range.fromDate}
                onChange={(v) => setRange({ ...range, fromDate: v })}
              />
              <DateField label="To date" value={range.toDate} onChange={(v) => setRange({ ...range, toDate: v })} />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
              {Object.entries(filters).flatMap(([k, vals]) =>
                (vals ?? []).map((v) => (
                  <button
                    key={`${k}-${v}`}
                    onClick={() => toggle(k, v)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                  >
                    {FACETS.find((f) => f.key === k)?.label}: {v} ✕
                  </button>
                )),
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] tracking-widest text-muted-foreground uppercase">{label}</span>
      <input
        type="number"
        step="0.1"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="num h-9 w-full rounded-xl border border-border bg-surface-2/70 px-3 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] tracking-widest text-muted-foreground uppercase">{label}</span>
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="num h-9 w-full rounded-xl border border-border bg-surface-2/70 px-3 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}
