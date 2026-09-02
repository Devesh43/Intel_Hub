import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { StackedBars, TrendArea } from "@/components/intel/Charts";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { StatusChip } from "@/components/intel/StatusChip";
import { SummaryTiles } from "@/components/intel/SummaryTiles";
import { ImeiRecordsPanel, MobileRecordsPanel, useFilteredMobiles } from "@/components/intel/RecordTables";
import { useEntityDrawer } from "@/components/intel/EntityLinks";
import { useApplyFilter } from "@/lib/filter-context";
import { imeiTiles, monthlySeries, stateRows } from "@/lib/telecom";

export const Route = createFileRoute("/imei/")({
  head: () => ({
    meta: [
      { title: "IMEI Dashboard | NCRP Telecom Intelligence" },
      { name: "description", content: "IMEI numbers requested for blocking, blocked, unblocked and linked to mule accounts." },
      { property: "og:title", content: "IMEI Dashboard | NCRP Telecom Intelligence" },
      { property: "og:description", content: "IMEI numbers requested for blocking, blocked, unblocked and linked to mule accounts." },
    ],
  }),
  component: ImeiDashboard,
});

function ImeiDashboard() {
  const apply = useApplyFilter();
  const { open } = useEntityDrawer();
  const mobiles = useFilteredMobiles();

  return (
    <>
      <PageHeader
        title="IMEI Dashboard"
        description="IMEI numbers requested for blocking, blocked, unblocked and linked to mule accounts."
        crumbs={[{ label: "Telecom Module" }, { label: "IMEI Number" }, { label: "Dashboard" }]}
        meta={<><StatusChip tone="success" dot>Live</StatusChip><StatusChip tone="info" onClick={() => apply("dotStatus", "DoT Verified", "DoT verified")}>DoT API synced</StatusChip></>}
      />
      <SummaryTiles tiles={imeiTiles} />
      <ImeiRecordsPanel />
      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="12-month trend" subtitle="Reported vs actioned · click a month" />
          <TrendArea
            data={monthlySeries("imei-trend", imeiTiles[0].value)}
            onSelect={() => apply("ceirStatus", "CEIR Barred", "CEIR barred handsets")}
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
      <MobileRecordsPanel title="Numbers behind these handsets" subtitle="Same corpus, number-centric view" rows={mobiles} />
      <HierarchyExplorer />
    </>
  );
}
