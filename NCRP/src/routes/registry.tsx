import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { StatusChip } from "@/components/intel/StatusChip";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { ComplaintRecordsPanel, ImeiRecordsPanel, MobileRecordsPanel, PosRecordsPanel, useFilteredMobiles } from "@/components/intel/RecordTables";

export const Route = createFileRoute("/registry")({
  head: () => ({
    meta: [
      { title: "Suspect Registry | NCRP Telecom Intelligence" },
      { name: "description", content: "Unified registry of suspect mobile numbers across all states and LSAs." },
      { property: "og:title", content: "Suspect Registry | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Unified registry of suspect mobile numbers across all states and LSAs." },
    ],
  }),
  component: Page,
});

function Page() {
  const rows = useFilteredMobiles();
  return (
    <>
      <PageHeader title="Suspect Registry" description="Unified registry of suspect mobile numbers across all states and LSAs." crumbs={[{ label: "Telecom Module" }, { label: "Suspect Registry" }]}
        meta={<StatusChip tone="info">{rows.length} records in scope</StatusChip>} />
      <MobileRecordsPanel rows={rows} pageSize={12} />
      <ComplaintRecordsPanel />
      <ImeiRecordsPanel />
      <PosRecordsPanel />
      <HierarchyExplorer />
    </>
  );
}
