import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { StatusChip } from "@/components/intel/StatusChip";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { ComplaintRecordsPanel, ImeiRecordsPanel, MobileRecordsPanel, PosRecordsPanel, useFilteredMobiles } from "@/components/intel/RecordTables";

export const Route = createFileRoute("/mobile/samanvaya")({
  head: () => ({
    meta: [
      { title: "Mobile Numbers on Samanvaya | NCRP Telecom Intelligence" },
      { name: "description", content: "Suspect numbers with an existing Samanvaya profile and inter-state linkage." },
      { property: "og:title", content: "Mobile Numbers on Samanvaya | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Suspect numbers with an existing Samanvaya profile and inter-state linkage." },
    ],
  }),
  component: Page,
});

function Page() {
  const rows = useFilteredMobiles().filter((m) => m.samanvayaProfile === "Yes");
  return (
    <>
      <PageHeader title="Mobile Numbers on Samanvaya" description="Suspect numbers with an existing Samanvaya profile and inter-state linkage." crumbs={[{ label: "Telecom Module" }, { label: "Mobile Number" }, { label: "Samanvaya" }]}
        meta={<StatusChip tone="info">{rows.length} linked profiles</StatusChip>} />
      <MobileRecordsPanel title="Samanvaya-linked numbers" subtitle="Inter-state linkage available on the Samanvaya platform" rows={rows} />
      <PosRecordsPanel title="Points of sale behind these numbers" subtitle="SIM origin for Samanvaya-linked identifiers" />
      <HierarchyExplorer />
    </>
  );
}
