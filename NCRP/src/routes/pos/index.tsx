import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { StackedBars, TrendArea } from "@/components/intel/Charts";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { StatusChip } from "@/components/intel/StatusChip";
import { SummaryTiles } from "@/components/intel/SummaryTiles";
import { PosRecordsPanel } from "@/components/intel/RecordTables";
import { useEntityDrawer } from "@/components/intel/EntityLinks";
import { useApplyFilter } from "@/lib/filter-context";
import { monthlySeries, posTiles, stateRows } from "@/lib/telecom";

export const Route = createFileRoute("/pos/")({
  head: () => ({
    meta: [
      { title: "SIM Point of Sale Dashboard | NCRP Telecom Intelligence" },
      { name: "description", content: "Suspect, blacklisted and FIR-registered points of sale across the SIM supply chain." },
      { property: "og:title", content: "SIM Point of Sale Dashboard | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Suspect, blacklisted and FIR-registered points of sale across the SIM supply chain." },
    ],
  }),
  component: PosDashboard,
});

function PosDashboard() {
  const apply = useApplyFilter();
  const { open } = useEntityDrawer();
  return (
    <>
      <PageHeader
        title="SIM Point of Sale Dashboard"
        description="Suspect, blacklisted and FIR-registered points of sale across the SIM supply chain."
        crumbs={[{ label: "Telecom Module" }, { label: "SIM Point of Sale" }, { label: "Dashboard" }]}
        meta={<><StatusChip tone="success" dot>Live</StatusChip><StatusChip tone="info" onClick={() => apply("statusOfPos", "Blacklisted", "Blacklisted PoS")}>DoT API synced</StatusChip></>}
      />
      <SummaryTiles tiles={posTiles} />
      <PosRecordsPanel />
      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="12-month trend" subtitle="Reported vs actioned · click a month" />
          <TrendArea
            data={monthlySeries("pos-trend", posTiles[0].value)}
            onSelect={() => apply("statusOfPos", "Under Review", "PoS under review")}
            keys={[
              { key: "reported", label: "Reported", color: "var(--chart-1)" },
              { key: "blocked", label: "Actioned", color: "var(--chart-4)" },
            ]}
          />
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHeader title="State posture" subtitle="Click a bar to open the state dossier" />
          <StackedBars
            data={stateRows}
            xKey="state"
            onSelect={(row) => row?.state && open("state", row.state)}
            keys={[
              { key: "blocked", label: "Blocked", color: "var(--chart-4)" },
              { key: "notBlocked", label: "Not blocked", color: "var(--chart-3)" },
            ]}
          />
        </Panel>
      </div>
      <HierarchyExplorer />
    </>
  );
}
