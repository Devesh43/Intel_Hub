import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { MetricCard } from "@/components/intel/MetricCard";
import { DataTable } from "@/components/intel/DataTable";
import { TrendLine, StackedBars, Heatmap } from "@/components/intel/Charts";
import { StatusChip } from "@/components/intel/StatusChip";
import { formatNumber, monthlySeries, stateRows, imeiTiles } from "@/lib/telecom";
import { Gauge, Timer, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/imei/performance")({
  head: () => ({
    meta: [
      { title: "IMEI Performance Report | NCRP Telecom Intelligence" },
      { name: "description", content: "CEIR blocking throughput, unblocking and device-level effectiveness." },
      { property: "og:title", content: "IMEI Performance Report | NCRP Telecom Intelligence" },
      { property: "og:description", content: "CEIR blocking throughput, unblocking and device-level effectiveness." },
    ],
  }),
  component: ImeiPerformance,
});

function ImeiPerformance() {
  const [state, setState] = useState("");
  const rows = stateRows.filter((r) => !state || r.state === state);
  const perfRows = rows.map((r) => ({
    state: r.state,
    total: r.totalSuspectNumbers,
    blocked: r.blocked,
    pending: r.notBlocked,
    blockRate: Math.round((r.blocked / r.totalSuspectNumbers) * 1000) / 10,
    plotRate: Math.round((r.plottedOnPratibimb / r.totalSuspectNumbers) * 1000) / 10,
    avgTat: `${1 + (r.state.length % 3)} days`,
  }));

  return (
    <>
      <PageHeader
        title="IMEI Performance Report"
        description="CEIR blocking throughput, unblocking and device-level effectiveness."
        crumbs={[{ label: "Telecom Module" }, { label: "IMEI Number" }, { label: "Performance Report" }]}
        meta={<><StatusChip tone="info">Rolling 12 months</StatusChip><StatusChip tone="success" dot>Auto-refresh</StatusChip></>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard id="perf-total" index={0} title="Total processed" value={rows.reduce((s, r) => s + r.totalSuspectNumbers, 0)} icon={<Gauge className="size-4" />} />
        <MetricCard id="perf-blocked" index={1} title="Blocked" value={rows.reduce((s, r) => s + r.blocked, 0)} tone="emerald" icon={<TrendingUp className="size-4" />} />
        <MetricCard id="perf-pending" index={2} title="Pending action" value={rows.reduce((s, r) => s + r.notBlocked, 0)} tone="amber" icon={<Timer className="size-4" />} />
        <MetricCard id="perf-plot" index={3} title="Plotted on Pratibimb" value={rows.reduce((s, r) => s + r.plottedOnPratibimb, 0)} tone="cyan" icon={<Gauge className="size-4" />} />
      </div>
      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="Monthly growth" subtitle="Reported, blocked and plotted" />
          <TrendLine data={monthlySeries("ImeiPerformance", imeiTiles[0].value)} keys={[
            { key: "reported", label: "Reported", color: "var(--chart-1)" },
            { key: "blocked", label: "Blocked", color: "var(--chart-4)" },
            { key: "plotted", label: "Plotted", color: "var(--chart-2)" },
          ]} />
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHeader title="Comparison across states" />
          <StackedBars data={rows} xKey="state" keys={[
            { key: "blocked", label: "Blocked", color: "var(--chart-4)" },
            { key: "notBlocked", label: "Not blocked", color: "var(--chart-3)" },
            { key: "plottedOnPratibimb", label: "Pratibimb", color: "var(--chart-2)" },
          ]} onSelect={(d) => setState(d?.state ?? "")} />
        </Panel>
      </div>
      <Panel className="mb-6 overflow-hidden">
        <PanelHeader title="Density heatmap" subtitle="State performance intensity" />
        <Heatmap
          rows={stateRows.map((s) => s.state)}
          columns={["Total", "Blocked", "Pending", "Pratibimb"]}
          cell={(r, c) => {
            const row = stateRows.find((s) => s.state === r)!;
            return c === "Total" ? row.totalSuspectNumbers : c === "Blocked" ? row.blocked : c === "Pending" ? row.notBlocked : row.plottedOnPratibimb;
          }}
          onSelect={(r) => setState(r)}
        />
      </Panel>
      <Panel className="overflow-hidden">
        <PanelHeader title="Performance table" subtitle="Turnaround and effectiveness by state" actions={state && <button onClick={() => setState("")} className="rounded-lg border border-border px-2.5 py-1 text-[11px]">Clear filter: {state}</button>} />
        <DataTable
          data={perfRows}
          exportName="performance-report"
          filters={[{ key: "state", label: "State", options: stateRows.map((s) => s.state), value: state, onChange: setState }]}
          columns={[
            { key: "state", header: "State / LSA" },
            { key: "total", header: "Total", align: "right", render: (r) => <span className="num">{formatNumber(r.total)}</span> },
            { key: "blocked", header: "Blocked", align: "right", render: (r) => <span className="num text-emerald">{formatNumber(r.blocked)}</span> },
            { key: "pending", header: "Pending", align: "right", render: (r) => <span className="num text-destructive">{formatNumber(r.pending)}</span> },
            { key: "blockRate", header: "Block rate", align: "right", render: (r) => <StatusChip tone={r.blockRate > 65 ? "success" : "warning"}>{r.blockRate}%</StatusChip> },
            { key: "plotRate", header: "Plot rate", align: "right", render: (r) => <span className="num">{r.plotRate}%</span> },
            { key: "avgTat", header: "Avg TAT", align: "right" },
          ]}
        />
      </Panel>
    </>
  );
}
