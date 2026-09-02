import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Panel, PanelHeader, Field } from "@/components/intel/Panel";
import { StatusChip } from "@/components/intel/StatusChip";
import { GeoCanvas, GEO } from "@/components/intel/GeoCanvas";
import { DataTable } from "@/components/intel/DataTable";
import {
  formatLac,
  getComplaints,
  getImeis,
  getPos,
  seeded,
  type ComplaintRow,
} from "@/lib/telecom";
import {
  Banknote,
  FileText,
  Landmark,
  MapPinned,
  Paperclip,
  Printer,
  ScrollText,
  Smartphone,
  User,
  UserSearch,
} from "lucide-react";
import { motion } from "motion/react";

function Step({ when, title, detail, last }: { when: string; title: string; detail: string; last?: boolean }) {
  return (
    <div className="relative pb-5 pl-7 last:pb-0">
      {!last && <span className="absolute top-3 left-[7px] h-full w-px bg-border" />}
      <span className="absolute top-1.5 left-0 size-3.5 rounded-full border-2 border-primary bg-primary/25" />
      <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{when}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

export function ComplaintDossier({
  complaint,
  mobileNumber,
  open,
  onOpenChange,
}: {
  complaint: ComplaintRow;
  mobileNumber: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const r = seeded(complaint.ackNumber);
  const imeis = getImeis(mobileNumber);
  const pos = getPos("1234");
  const geo = GEO[complaint.district] ?? GEO[complaint.state] ?? { lat: 28.61, lng: 77.21 };
  const linked = getComplaints(mobileNumber).filter((c) => c.ackNumber !== complaint.ackNumber);

  const victimName = ["A. Verma", "S. Iyer", "R. Khan", "P. Das", "M. Gupta"][Math.floor(r * 5)];
  const bank = ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "PNB"][Math.floor(r * 5)];

  const timeline = [
    { when: complaint.dateReported, title: "Fraud initiated", detail: `Victim contacted from ${mobileNumber} posing as ${["bank KYC", "courier refund", "digital arrest", "investment desk"][Math.floor(r * 4)]}` },
    { when: complaint.dateReported, title: "Funds debited", detail: `${formatLac(complaint.amountInvolved)} transferred to layer 1 mule account` },
    { when: complaint.dateReported, title: "Complaint filed on NCRP", detail: `${complaint.policeStation}, ${complaint.district}` },
    { when: "12/05/2026", title: "Blocking request raised", detail: "Sent to TSP through DoT API" },
    { when: "13/05/2026", title: "Number blocked", detail: "Confirmation received from TSP" },
  ];

  const actions = [
    { date: complaint.dateReported, actor: "NCRP Intake", action: "Complaint registered", status: "Closed" },
    { date: "11/05/2026", actor: `${complaint.district} Cyber Cell`, action: "Assigned to IO", status: "Closed" },
    { date: "12/05/2026", actor: "State Nodal Officer", action: "Telecom blocking request", status: "Closed" },
    { date: "13/05/2026", actor: "TSP", action: "SIM disconnected", status: "Closed" },
    { date: "14/05/2026", actor: "IO", action: complaint.status, status: complaint.status },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(1120px,96vw)] overflow-hidden p-0 sm:max-w-[min(1120px,96vw)]">
        <div className="relative border-b border-border bg-surface-2/60 px-6 py-5">
          <div className="pointer-events-none absolute inset-0 grid-canvas opacity-60" />
          <DialogHeader className="relative">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-violet/40 bg-violet/10 text-violet">
                  <ScrollText className="size-5" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="num truncate text-lg">{complaint.ackNumber}</DialogTitle>
                  <DialogDescription className="truncate text-xs">
                    {complaint.policeStation} · {complaint.district}, {complaint.state} · reported {complaint.dateReported}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusChip>{complaint.status}</StatusChip>
                <button onClick={() => window.print()} aria-label="Print complaint dossier" className="grid size-8 place-items-center rounded-lg border border-border hover:text-primary">
                  <Printer className="size-4" />
                </button>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[68vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader icon={<FileText className="size-4" />} title="Incident summary" />
              <div className="grid gap-2 p-4 sm:grid-cols-3">
                <Field label="Category" value="Online financial fraud" />
                <Field label="Sub-category" value="UPI / internet banking fraud" />
                <Field label="Amount involved" value={formatLac(complaint.amountInvolved)} />
                <Field label="Reported on" value={complaint.dateReported} />
                <Field label="State / LSA" value={complaint.state} />
                <Field label="District" value={complaint.district} />
                <Field label="Police station" value={complaint.policeStation} />
                <Field label="Suspect mobile" value={<span className="num">{mobileNumber}</span>} />
                <Field label="Status" value={<StatusChip>{complaint.status}</StatusChip>} />
              </div>
            </Panel>
            <Panel>
              <PanelHeader icon={<User className="size-4" />} title="Victim details" />
              <div className="grid gap-2 p-4">
                <Field label="Name" value={victimName} />
                <Field label="Contact" value={<span className="num">9{Math.floor(r * 899999999) + 100000000}</span>} />
                <Field label="Bank" value={bank} />
                <Field label="District" value={complaint.district} />
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader icon={<Landmark className="size-4" />} title="Fraud timeline" />
              <div className="p-5">
                {timeline.map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Step {...t} last={i === timeline.length - 1} />
                  </motion.div>
                ))}
              </div>
            </Panel>
            <div className="space-y-4">
              <Panel>
                <PanelHeader icon={<Banknote className="size-4" />} title="Financial details" />
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                  <Field label="Transaction amount" value={formatLac(complaint.amountInvolved)} />
                  <Field label="Mode" value="UPI" />
                  <Field label="Beneficiary bank" value={bank} />
                  <Field label="Mule layer" value="Layer 1" />
                  <Field label="Amount put on hold" value={formatLac(complaint.amountInvolved * 0.42)} />
                  <Field label="Lien marked" value={<StatusChip tone="success">Yes</StatusChip>} />
                </div>
              </Panel>
              <Panel>
                <PanelHeader icon={<UserSearch className="size-4" />} title="Suspect details" />
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                  <Field label="Suspect mobile" value={<span className="num">{mobileNumber}</span>} />
                  <Field label="PoS of SIM issue" value={pos?.posName ?? "—"} />
                  <Field label="KYC agent" value={pos?.posAgentName ?? "—"} />
                  <Field label="TSP" value={pos?.tsp ?? "—"} />
                </div>
              </Panel>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader icon={<Smartphone className="size-4" />} title="Linked devices & SIMs" />
              <DataTable
                data={imeis}
                pageSize={4}
                exportName={`linked-devices-${complaint.ackNumber}`}
                columns={[
                  { key: "imeiNumber", header: "IMEI", render: (i) => <span className="num">{i.imeiNumber}</span> },
                  { key: "mobileNumber", header: "SIM", render: (i) => <span className="num">{i.mobileNumber}</span> },
                  { key: "dateOfSimInsert", header: "SIM insert" },
                  { key: "imeiBlockingStatus", header: "Blocking", render: (i) => <StatusChip>{i.imeiBlockingStatus}</StatusChip> },
                ]}
              />
            </Panel>
            <Panel className="overflow-hidden">
              <PanelHeader icon={<MapPinned className="size-4" />} title="Incident geography" subtitle={`${complaint.district}, ${complaint.state}`} />
              <GeoCanvas height={260} points={[{ id: complaint.ackNumber, label: complaint.policeStation, lat: geo.lat, lng: geo.lng, weight: complaint.amountInvolved, meta: `${complaint.district}, ${complaint.state}` }]} />
            </Panel>
          </div>

          <Panel>
            <PanelHeader icon={<ScrollText className="size-4" />} title="Linked complaints" subtitle="Other complaints tagged to the same suspect number" />
            <DataTable
              data={linked}
              pageSize={4}
              exportName={`linked-complaints-${complaint.ackNumber}`}
              emptyLabel="No other complaints are tagged to this suspect number."
              columns={[
                { key: "ackNumber", header: "Ack number", render: (c) => <span className="num text-primary">{c.ackNumber}</span> },
                { key: "district", header: "District" },
                { key: "policeStation", header: "Police station" },
                { key: "dateReported", header: "Reported" },
                { key: "amountInvolved", header: "Amount", align: "right", render: (c) => <span className="num">{formatLac(c.amountInvolved)}</span> },
                { key: "status", header: "Status", render: (c) => <StatusChip>{c.status}</StatusChip> },
              ]}
            />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Panel>
              <PanelHeader icon={<ScrollText className="size-4" />} title="Action history" />
              <DataTable
                data={actions}
                pageSize={5}
                exportName={`actions-${complaint.ackNumber}`}
                columns={[
                  { key: "date", header: "Date" },
                  { key: "actor", header: "Actor" },
                  { key: "action", header: "Action" },
                  { key: "status", header: "Status", render: (a) => <StatusChip>{a.status}</StatusChip> },
                ]}
              />
            </Panel>
            <Panel>
              <PanelHeader icon={<Paperclip className="size-4" />} title="Evidence" />
              <ul className="space-y-2 p-4">
                {["Bank statement.pdf", "Transaction screenshot.png", "Chat transcript.txt", "FIR copy.pdf"].map((f) => (
                  <li key={f} className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-xs">
                    <span className="truncate">{f}</span>
                    <StatusChip tone="info">verified</StatusChip>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
