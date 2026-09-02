import { useMemo, useState } from "react";
import { Radar, Search } from "lucide-react";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { DataTable, type Column } from "@/components/intel/DataTable";
import { StatusChip } from "@/components/intel/StatusChip";
import { EntityLink, useEntityDrawer } from "@/components/intel/EntityLinks";
import { ENTITY_LABELS, searchAll, type EntityType, type SearchRecord } from "@/lib/intel";
import { cn } from "@/lib/utils";

const TYPES = Object.keys(ENTITY_LABELS) as EntityType[];

export function GlobalSearchTable({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [types, setTypes] = useState<EntityType[]>([]);
  const { open } = useEntityDrawer();

  const results = useMemo(() => searchAll(query, types), [query, types]);

  const columns: Column<SearchRecord>[] = [
    {
      key: "type",
      header: "Entity",
      value: (r) => ENTITY_LABELS[r.type],
      render: (r) => <StatusChip tone="violet">{ENTITY_LABELS[r.type]}</StatusChip>,
    },
    {
      key: "title",
      header: "Identifier",
      value: (r) => r.title,
      render: (r) => <EntityLink type={r.type} id={r.id} mono className="font-medium">{r.title}</EntityLink>,
    },
    { key: "subtitle", header: "Summary", value: (r) => r.subtitle },
    {
      key: "context",
      header: "Jurisdiction / context",
      value: (r) => r.context,
    },
    {
      key: "status",
      header: "Status",
      value: (r) => r.status,
      render: (r) => <StatusChip>{r.status}</StatusChip>,
    },
    {
      key: "haystack",
      header: "Match keys",
      value: (r) => r.haystack,
      render: (r) => <span className="text-[10px] text-muted-foreground">{r.haystack.slice(0, 60)}…</span>,
    },
  ];

  return (
    <Panel className="mb-6 overflow-hidden">
      <PanelHeader
        title="Global intelligence search"
        subtitle="Query complaints, numbers, IMEI, PoS, operators, victims, suspects, jurisdictions, circulars and the contact directory at once"
        icon={<Radar className="size-4" />}
        actions={<StatusChip tone="info">{results.length.toLocaleString("en-IN")} records</StatusChip>}
      />
      <div className="space-y-3 px-5 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a mobile number, IMEI, complaint ID, PoS code, officer, district…"
            aria-label="Global intelligence search"
            className="h-11 w-full rounded-2xl border border-border bg-surface-2/70 pr-4 pl-11 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypes([])}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              types.length === 0 ? "border-primary/60 bg-primary/12 text-primary" : "border-border bg-surface-2/70",
            )}
          >
            All entities
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                types.includes(t) ? "border-primary/60 bg-primary/12 text-primary" : "border-border bg-surface-2/70",
              )}
            >
              {ENTITY_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        data={results}
        columns={columns}
        searchPlaceholder="Refine within results…"
        exportName="global-intelligence-search"
        pageSize={8}
        emptyLabel="No intelligence records match this query."
        onRowClick={(r) => open(r.type, r.id)}
      />
    </Panel>
  );
}
