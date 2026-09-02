import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { StatusChip } from "@/components/intel/StatusChip";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { ComplaintRecordsPanel, ImeiRecordsPanel, MobileRecordsPanel, PosRecordsPanel, useFilteredMobiles } from "@/components/intel/RecordTables";

export const Route = createFileRoute("/imei/samanvaya")({
  head: () => ({
    meta: [
      { title: "IMEI on Samanvaya | NCRP Telecom Intelligence" },
      { name: "description", content: "Handsets recorded on Samanvaya with seizure and linkage details." },
      { property: "og:title", content: "IMEI on Samanvaya | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Handsets recorded on Samanvaya with seizure and linkage details." },
    ],
  }),
  component: Page,
});

function Page() {
  const rows = useFilteredMobiles().filter((m) => m.samanvayaProfile === "Yes");
  const imeis = rows.flatMap((m) => m.imeis);
  return (
    <>
      <PageHeader title="IMEI on Samanvaya" description="Handsets recorded on Samanvaya with seizure and linkage details." crumbs={[{ label: "Telecom Module" }, { label: "IMEI Number" }, { label: "Samanvaya" }]}
        meta={<StatusChip tone="info">{imeis.length} handsets</StatusChip>} />
      <ImeiRecordsPanel title="Samanvaya-linked handsets" subtitle="Seized or linked devices recorded on Samanvaya" rows={imeis} />
      <MobileRecordsPanel title="Numbers behind these handsets" subtitle="Same corpus, number-centric view" rows={rows} />
      <HierarchyExplorer />
    </>
  );
}
