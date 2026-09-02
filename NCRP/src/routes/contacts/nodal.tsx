import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { DataTable } from "@/components/intel/DataTable";
import { OFFICERS } from "@/lib/directory";

export const Route = createFileRoute("/contacts/nodal")({
  head: () => ({
    meta: [
      { title: "Nodal Officers | NCRP Telecom Intelligence" },
      { name: "description", content: "State and UT cyber crime nodal officers responsible for telecom actions." },
      { property: "og:title", content: "Nodal Officers | NCRP Telecom Intelligence" },
      { property: "og:description", content: "State and UT cyber crime nodal officers responsible for telecom actions." },
    ],
  }),
  component: NodalContacts,
});

function NodalContacts() {
  const rows = OFFICERS.filter((o) => o.category === "Nodal Officer");
  return (
    <>
      <PageHeader title="Nodal Officers" description="State and UT cyber crime nodal officers responsible for telecom actions." crumbs={[{ label: "Telecom Module" }, { label: "Contacts" }, { label: "Nodal Officers" }]} />
      <Panel className="overflow-hidden">
        <PanelHeader title="Nodal Officers" subtitle={`${rows.length} officers`} />
        <DataTable
          data={rows}
          exportName="nodal-officer"
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
