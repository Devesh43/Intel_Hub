import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { StatusChip } from "@/components/intel/StatusChip";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { ComplaintRecordsPanel, ImeiRecordsPanel, MobileRecordsPanel, PosRecordsPanel, useFilteredMobiles } from "@/components/intel/RecordTables";

export const Route = createFileRoute("/imei/dot-analysis")({
  head: () => ({
    meta: [
      { title: "IMEI from DoT Analysis | NCRP Telecom Intelligence" },
      { name: "description", content: "IMEI shared by DoT and found fit for blocking after CEIR validation." },
      { property: "og:title", content: "IMEI from DoT Analysis | NCRP Telecom Intelligence" },
      { property: "og:description", content: "IMEI shared by DoT and found fit for blocking after CEIR validation." },
    ],
  }),
  component: Page,
});

function Page() {
  const rows = useFilteredMobiles().filter((m) => m.dotFlag === "Yes" || m.dotStatus === "DoT Verified");
  const imeis = rows.flatMap((m) => m.imeis);
  return (
    <>
      <PageHeader title="IMEI from DoT Analysis" description="IMEI shared by DoT and found fit for blocking after CEIR validation." crumbs={[{ label: "Telecom Module" }, { label: "IMEI Number" }, { label: "DoT Analysis" }]}
        meta={<StatusChip tone="info">{imeis.length} handsets flagged</StatusChip>} />
      <ImeiRecordsPanel title="DoT-flagged handsets" subtitle="Validated against CEIR before blocking" rows={imeis} />
      <MobileRecordsPanel title="Numbers shared by DoT" subtitle="Numbers carrying a DoT flag in the shared corpus" rows={rows} />
      <HierarchyExplorer />
    </>
  );
}
