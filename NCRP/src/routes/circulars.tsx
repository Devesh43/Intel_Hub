import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { DataTable } from "@/components/intel/DataTable";
import { StatusChip } from "@/components/intel/StatusChip";
import { CIRCULARS } from "@/lib/directory";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/circulars")({
  head: () => ({
    meta: [
      { title: "Circulars & Advisories | NCRP Telecom Intelligence" },
      { name: "description", content: "MHA, I4C and DoT circulars, SOPs and advisories governing the telecom module workflow." },
      { property: "og:title", content: "Circulars & Advisories | NCRP Telecom Intelligence" },
      { property: "og:description", content: "MHA, I4C and DoT circulars, SOPs and advisories governing the telecom module workflow." },
    ],
  }),
  component: Circulars,
});

function Circulars() {
  const pinned = CIRCULARS.filter((c) => c.pinned);
  return (
    <>
      <PageHeader title="Circulars & Advisories" description="MHA · I4C · DoT issuances governing telecom actions"
        crumbs={[{ label: "Telecom Module" }, { label: "Circulars" }]} />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {pinned.map((c) => (
          <Panel key={c.id} className="p-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="num text-[11px] text-muted-foreground">{c.id} · {c.date}</div>
                <h3 className="mt-1 text-sm font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <StatusChip tone="danger">{c.priority}</StatusChip>
                  <StatusChip tone="info">{c.category}</StatusChip>
                  <StatusChip tone="neutral">{c.issuedBy}</StatusChip>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      <Panel className="overflow-hidden">
        <PanelHeader title="All issuances" subtitle={`${CIRCULARS.length} documents`} />
        <DataTable
          data={CIRCULARS}
          exportName="circulars"
          columns={[
            { key: "id", header: "Circular no.", render: (r) => <span className="num text-primary">{r.id}</span> },
            { key: "title", header: "Title" },
            { key: "category", header: "Category", render: (r) => <StatusChip tone="info">{r.category}</StatusChip> },
            { key: "priority", header: "Priority", render: (r) => <StatusChip>{r.priority}</StatusChip> },
            { key: "issuedBy", header: "Issued by" },
            { key: "date", header: "Date" },
            { key: "pages", header: "Pages", align: "right" },
          ]}
        />
      </Panel>
    </>
  );
}
