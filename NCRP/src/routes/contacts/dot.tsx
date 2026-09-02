import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { DataTable } from "@/components/intel/DataTable";
import { OFFICERS } from "@/lib/directory";

export const Route = createFileRoute("/contacts/dot")({
  head: () => ({
    meta: [
      { title: "DoT Task Force | NCRP Telecom Intelligence" },
      { name: "description", content: "Department of Telecommunications task force members by LSA and TSP liaison." },
      { property: "og:title", content: "DoT Task Force | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Department of Telecommunications task force members by LSA and TSP liaison." },
    ],
  }),
  component: DotContacts,
});

function DotContacts() {
  const rows = OFFICERS.filter((o) => o.category === "DoT Task Force");
  return (
    <>
      <PageHeader title="DoT Task Force" description="Department of Telecommunications task force members by LSA and TSP liaison." crumbs={[{ label: "Telecom Module" }, { label: "Contacts" }, { label: "DoT Task Force" }]} />
      <Panel className="overflow-hidden">
        <PanelHeader title="DoT Task Force" subtitle={`${rows.length} officers`} />
        <DataTable
          data={rows}
          exportName="dot-task-force"
          columns={[
            { key: "name", header: "Officer" },
            { key: "designation", header: "Designation" },
            { key: "department", header: "Department" },
            { key: "state", header: "State / LSA" },
            { key: "phone", header: "Phone", render: (r) => <span className="num">{r.phone}</span> },
            { key: "email", header: "Email", render: (r) => <span className="text-primary">{r.email}</span> },
          ]}
        />
      </Panel>
    </>
  );
}
