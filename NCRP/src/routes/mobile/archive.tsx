import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { StatusChip } from "@/components/intel/StatusChip";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { ComplaintRecordsPanel, ImeiRecordsPanel, MobileRecordsPanel, PosRecordsPanel, useFilteredMobiles } from "@/components/intel/RecordTables";

export const Route = createFileRoute("/mobile/archive")({
  head: () => ({
    meta: [
      { title: "Mobile Number Archive | NCRP Telecom Intelligence" },
      { name: "description", content: "Historic suspect mobile numbers retained for evidentiary and audit purposes." },
      { property: "og:title", content: "Mobile Number Archive | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Historic suspect mobile numbers retained for evidentiary and audit purposes." },
    ],
  }),
  component: Page,
});

function Page() {
  const rows = useFilteredMobiles();
  const archived = rows.filter((m) => m.blockingStatus === "Blocked" || m.investigationStatus === "Closed");
  return (
    <>
      <PageHeader title="Mobile Number Archive" description="Historic suspect mobile numbers retained for evidentiary and audit purposes." crumbs={[{ label: "Telecom Module" }, { label: "Mobile Number" }, { label: "Archive" }]}
        meta={<StatusChip tone="info">{archived.length} archived records</StatusChip>} />
      <MobileRecordsPanel title="Archived suspect numbers" subtitle="Blocked or closed cases retained for audit" rows={archived} />
      <ComplaintRecordsPanel title="Complaints attached to archived numbers" subtitle="Full money trail retained with each acknowledgement" />
      <HierarchyExplorer />
    </>
  );
}
