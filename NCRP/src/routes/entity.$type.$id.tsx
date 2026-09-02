import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Network } from "lucide-react";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { StatusChip } from "@/components/intel/StatusChip";
import { EntityBody, ChipLink } from "@/components/intel/EntityLinks";
import {
  ComplaintRecordsPanel,
  ImeiRecordsPanel,
  MobileRecordsPanel,
  PosRecordsPanel,
} from "@/components/intel/RecordTables";
import {
  ENTITY_LABELS,
  complaintRecords,
  imeiRecords,
  mobileRecords,
  posRecords,
  type EntityType,
} from "@/lib/intel";

const TYPES = Object.keys(ENTITY_LABELS) as EntityType[];

export const Route = createFileRoute("/entity/$type/$id")({
  head: ({ params }) => {
    const label = ENTITY_LABELS[params.type as EntityType] ?? "Entity";
    const id = decodeURIComponent(params.id).split("|").pop();
    return {
      meta: [
        { title: `${label} ${id} | NCRP Telecom Intelligence` },
        { name: "description", content: `Full investigation dossier for ${label.toLowerCase()} ${id} with linked complaints, handsets, points of sale and jurisdictions.` },
        { property: "og:title", content: `${label} ${id} | NCRP Telecom Intelligence` },
        { property: "og:description", content: `Full investigation dossier for ${label.toLowerCase()} ${id}.` },
      ],
    };
  },
  component: EntityPage,
});

function EntityPage() {
  const { type, id: rawId } = Route.useParams();
  const navigate = useNavigate();
  const id = decodeURIComponent(rawId);
  const entityType = (TYPES.includes(type as EntityType) ? type : "mobile") as EntityType;
  const label = ENTITY_LABELS[entityType];

  const related = useMemo(() => {
    switch (entityType) {
      case "mobile":
        return {
          mobiles: mobileRecords.filter((m) => m.mobileNumber === id),
          complaints: complaintRecords.filter((c) => c.mobileNumber === id),
          imeis: imeiRecords.filter((i) => i.mobileNumber === id),
          pos: posRecords.filter((p) => p.linkedNumbers.includes(id)),
        };
      case "imei": {
        const mobile = imeiRecords.find((i) => i.imeiNumber === id)?.mobileNumber;
        return {
          mobiles: mobileRecords.filter((m) => m.mobileNumber === mobile),
          complaints: complaintRecords.filter((c) => c.mobileNumber === mobile),
          imeis: imeiRecords.filter((i) => i.imeiNumber === id),
          pos: posRecords.filter((p) => (mobile ? p.linkedNumbers.includes(mobile) : false)),
        };
      }
      case "complaint": {
        const c = complaintRecords.find((r) => r.ackNumber === id);
        return {
          mobiles: mobileRecords.filter((m) => m.mobileNumber === c?.mobileNumber),
          complaints: complaintRecords.filter((r) => r.mobileNumber === c?.mobileNumber),
          imeis: imeiRecords.filter((i) => i.mobileNumber === c?.mobileNumber),
          pos: posRecords.filter((p) => (c ? p.linkedNumbers.includes(c.mobileNumber) : false)),
        };
      }
      case "pos": {
        const numbers = posRecords.find((p) => p.posCode === id)?.linkedNumbers ?? [];
        return {
          mobiles: mobileRecords.filter((m) => numbers.includes(m.mobileNumber)),
          complaints: complaintRecords.filter((c) => numbers.includes(c.mobileNumber)),
          imeis: imeiRecords.filter((i) => numbers.includes(i.mobileNumber)),
          pos: posRecords.filter((p) => p.posCode === id),
        };
      }
      case "operator":
        return {
          mobiles: mobileRecords.filter((m) => m.operator === id),
          complaints: complaintRecords.filter((c) => c.operator === id),
          imeis: imeiRecords.filter((i) => i.operator === id),
          pos: posRecords.filter((p) => p.tsp === id),
        };
      case "state":
        return {
          mobiles: mobileRecords.filter((m) => m.state === id),
          complaints: complaintRecords.filter((c) => c.state === id),
          imeis: imeiRecords.filter((i) => i.state === id),
          pos: posRecords.filter((p) => p.state === id),
        };
      case "district": {
        const [st, dt] = id.split("|");
        return {
          mobiles: mobileRecords.filter((m) => m.state === st && m.district === dt),
          complaints: complaintRecords.filter((c) => c.state === st && c.district === dt),
          imeis: imeiRecords.filter((i) => i.state === st && i.district === dt),
          pos: posRecords.filter((p) => p.state === st && p.district === dt),
        };
      }
      case "ps": {
        const [st, dt, ps] = id.split("|");
        return {
          mobiles: mobileRecords.filter((m) => m.state === st && m.district === dt && m.policeStation === ps),
          complaints: complaintRecords.filter((c) => c.state === st && c.district === dt && c.policeStation === ps),
          imeis: imeiRecords.filter((i) => i.state === st && i.district === dt && i.policeStation === ps),
          pos: posRecords.filter((p) => p.state === st && p.district === dt),
        };
      }
      case "victim":
        return {
          mobiles: mobileRecords.filter((m) => m.victimName === id),
          complaints: complaintRecords.filter((c) => c.victimName === id),
          imeis: [],
          pos: [],
        };
      case "suspect":
        return {
          mobiles: mobileRecords.filter((m) => m.suspectName === id),
          complaints: complaintRecords.filter((c) => c.suspectName === id),
          imeis: [],
          pos: [],
        };
      default:
        return { mobiles: [], complaints: [], imeis: [], pos: [] };
    }
  }, [entityType, id]);

  const display = id.split("|").pop() ?? id;

  return (
    <>
      <PageHeader
        title={`${label} · ${display}`}
        description="Full investigation dossier with every linked record in the telecom corpus."
        crumbs={[{ label: "Telecom Module" }, { label: "Investigation" }, { label }]}
        meta={
          <>
            <StatusChip tone="violet">{label}</StatusChip>
            <StatusChip tone="info">{related.mobiles.length} numbers</StatusChip>
            <StatusChip tone="warning">{related.complaints.length} complaints</StatusChip>
            <StatusChip tone="success">{related.imeis.length} handsets</StatusChip>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> Back to command desk
        </button>
        <Link
          to="/registry"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
        >
          <Network className="size-3.5" /> Suspect registry
        </Link>
      </div>

      <Panel className="mb-6 overflow-hidden">
        <PanelHeader
          title="Record dossier"
          subtitle="Every value below opens the connected entity"
          icon={<Network className="size-4" />}
        />
        <div className="space-y-5 px-5 py-5">
          <EntityBody type={entityType} id={id} />
        </div>
      </Panel>

      {related.mobiles.length > 0 && (
        <MobileRecordsPanel
          title="Linked suspect numbers"
          subtitle={`Numbers connected to this ${label.toLowerCase()}`}
          rows={related.mobiles}
        />
      )}
      {related.complaints.length > 0 && (
        <ComplaintRecordsPanel
          title="Linked complaints"
          subtitle="NCRP acknowledgements attached to this record"
          rows={related.complaints}
        />
      )}
      {related.imeis.length > 0 && (
        <ImeiRecordsPanel title="Linked handsets" subtitle="IMEI records observed on these numbers" rows={related.imeis} />
      )}
      {related.pos.length > 0 && (
        <PosRecordsPanel title="Linked points of sale" subtitle="SIM supply-chain origin of these numbers" rows={related.pos} />
      )}

      <Panel className="overflow-hidden">
        <PanelHeader title="Jump to another entity type" subtitle="Cross-navigate the intelligence graph" />
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {related.mobiles.slice(0, 6).map((m) => (
            <ChipLink key={m.mobileNumber} type="mobile" id={m.mobileNumber} />
          ))}
          {related.complaints.slice(0, 6).map((c) => (
            <ChipLink key={c.ackNumber} type="complaint" id={c.ackNumber} />
          ))}
          {related.pos.slice(0, 4).map((p) => (
            <ChipLink key={p.posCode} type="pos" id={p.posCode} />
          ))}
        </div>
      </Panel>
    </>
  );
}
