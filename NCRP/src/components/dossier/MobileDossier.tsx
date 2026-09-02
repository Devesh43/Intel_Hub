import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, Field, PanelHeader } from "@/components/intel/Panel";
import { DataTable } from "@/components/intel/DataTable";
import { StatusChip } from "@/components/intel/StatusChip";
import { GeoCanvas, GEO } from "@/components/intel/GeoCanvas";
import {
  formatLac,
  formatNumber,
  getBlocking,
  getComplaints,
  getImeis,
  getPos,
  getPratibimb,
  seeded,
  type ComplaintRow,
  type PsMobileRow,
} from "@/lib/telecom";
import {
  Building2,
  CalendarClock,
  Download,
  Fingerprint,
  Globe2,
  IdCard,
  MapPinned,
  Phone,
  Printer,
  Radio,
  ShieldCheck,
  Signal,
  Smartphone,
  Timer,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { ComplaintDossier } from "./ComplaintDossier";

function TimelineStep({
  label,
  value,
  last,
  accent,
}: {
  label: string;
  value: string;
  last?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="relative pb-6 pl-7 last:pb-0">
      {!last && <span className="absolute top-3 left-[7px] h-full w-px bg-border" />}
      <span
        className={`absolute top-1.5 left-0 size-3.5 rounded-full border-2 ${
          accent ? "border-emerald bg-emerald/25" : "border-primary bg-primary/25"
        }`}
      />
      <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</div>
      <div className="num text-sm font-medium">{value}</div>
    </div>
  );
}

export function MobileDossier({
  row,
  open,
  onOpenChange,
  context,
}: {
  row: PsMobileRow & { state?: string; district?: string };
  open: boolean;
  onOpenChange: (v: boolean) => void;
  context?: { state?: string; district?: string; policeStation?: string };
}) {
  const [complaint, setComplaint] = useState<ComplaintRow | null>(null);
  const mobile = row.mobileNumber;
  const complaints = getComplaints(mobile).slice(0, Math.max(row.ncrpComplaints, 1));
  const imeis = getImeis(mobile);
  const blocking = getBlocking(mobile);
  const pos = getPos(row.posCode);
  const pratibimb = getPratibimb(mobile);

  const associated = Array.from({ length: row.associatedSuspectNumbers }).map((_, i) => {
    const r = seeded(mobile + "assoc", i);
    return {
      mobileNumber: String(7000000000 + Math.floor(r * 999999999)),
      linkVia: ["Common IMEI", "Common PoS", "Complaint tagging", "Mule account", "Roaming cluster"][i % 5],
      complaints: 1 + Math.floor(r * 3),
      amount: Math.round(r * 800) / 100,
      blockingStatus: r > 0.45 ? "Blocked" : "Not Blocked",
    };
  });

  const supplyChain = [
    { stage: "SIM manufactured", detail: `${pos?.tsp ?? "Airtel"} secure lot`, when: "02/01/2026" },
    { stage: "Dispatched to distributor", detail: `${pos?.lsa ?? "Haryana"} LSA distributor`, when: "18/02/2026" },
    { stage: "Allocated to PoS", detail: `${pos?.posName ?? "PoS"} (${row.posCode})`, when: "04/03/2026" },
    { stage: "Activated on subscriber", detail: `KYC by ${pos?.posAgentName ?? "agent"}`, when: "22/03/2026" },
    { stage: "First fraud report on NCRP", detail: complaints[0]?.ackNumber ?? "—", when: complaints[0]?.dateReported ?? "—" },
  ];

  const sdr = Array.from({ length: 8 }).map((_, i) => {
    const r = seeded(mobile + "sdr", i);
    return {
      callTime: `1${i}/05/2026 ${String(8 + i).padStart(2, "0")}:${String(Math.floor(r * 59)).padStart(2, "0")}`,
      bParty: String(6000000000 + Math.floor(r * 999999999)),
      type: r > 0.6 ? "MOC" : r > 0.3 ? "MTC" : "SMS",
      duration: `${Math.floor(r * 300)}s`,
      imei: imeis[0]?.imeiNumber ?? "—",
      cellSite: `${(pos?.lsa ?? "HR").slice(0, 2).toUpperCase()}-${Math.floor(r * 9000) + 1000}`,
      lat: (pos?.latitude ?? 28.6) + r * 0.4,
      lng: (pos?.longitude ?? 77.2) + r * 0.4,
    };
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] w-[min(1180px,96vw)] overflow-hidden p-0 sm:max-w-[min(1180px,96vw)]">
          <div className="relative border-b border-border bg-surface-2/60 px-6 py-5">
            <div className="pointer-events-none absolute inset-0 grid-canvas opacity-60" />
            <DialogHeader className="relative">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="num truncate text-xl">{mobile}</DialogTitle>
                    <DialogDescription className="truncate text-xs">
                      {context?.policeStation ? `${context.policeStation} · ` : ""}
                      {context?.district ?? row.district ?? "—"}, {context?.state ?? row.state ?? "—"} · PoS {row.posCode}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusChip>{row.blockingStatus}</StatusChip>
                  <button className="grid size-8 place-items-center rounded-lg border border-border hover:text-primary" onClick={() => window.print()} aria-label="Print dossier">
                    <Printer className="size-4" />
                  </button>
                </div>
              </div>
            </DialogHeader>
            <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="NCRP complaints" value={row.ncrpComplaints} />
              <Field label="Associated numbers" value={row.associatedSuspectNumbers} />
              <Field label="Amount involved" value={formatLac(row.totalAmountInvolvedLac)} />
              <Field label="Linked IMEI" value={row.linkedImei} />
              <Field label="DoT flag" value={<StatusChip>{row.dotFlag}</StatusChip>} />
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
            <Tabs defaultValue="complaints">
              <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-surface-2/70 p-1">
                <TabsTrigger value="complaints">Complaints</TabsTrigger>
                <TabsTrigger value="associated">Associated numbers</TabsTrigger>
                <TabsTrigger value="pos">PoS</TabsTrigger>
                <TabsTrigger value="imei">Linked IMEI</TabsTrigger>
                <TabsTrigger value="blocking">Blocking timeline</TabsTrigger>
                <TabsTrigger value="roaming">Intl. roaming</TabsTrigger>
                <TabsTrigger value="samanvaya">Samanvaya</TabsTrigger>
                <TabsTrigger value="pratibimb">Pratibimb</TabsTrigger>
                <TabsTrigger value="supply">SIM supply chain</TabsTrigger>
                <TabsTrigger value="sdr">SDR</TabsTrigger>
              </TabsList>

              <TabsContent value="complaints">
                <Panel>
                  <PanelHeader icon={<IdCard className="size-4" />} title="NCRP complaints" subtitle="Click an acknowledgement number to open the full complaint dossier" />
                  <DataTable
                    data={complaints}
                    exportName={`complaints-${mobile}`}
                    pageSize={6}
                    onRowClick={(c) => setComplaint(c)}
                    columns={[
                      { key: "ackNumber", header: "Ack number", render: (c) => <span className="num text-primary">{c.ackNumber}</span> },
                      { key: "state", header: "State/LSA" },
                      { key: "district", header: "District" },
                      { key: "policeStation", header: "Police station" },
                      { key: "dateReported", header: "Reported" },
                      { key: "amountInvolved", header: "Amount", align: "right", render: (c) => <span className="num">{formatLac(c.amountInvolved)}</span> },
                      { key: "status", header: "Status", render: (c) => <StatusChip>{c.status}</StatusChip> },
                    ]}
                  />
                </Panel>
              </TabsContent>

              <TabsContent value="associated">
                <Panel>
                  <PanelHeader icon={<Workflow className="size-4" />} title="Associated suspect numbers" subtitle="Complaint tagging graph" />
                  <DataTable
                    data={associated}
                    exportName={`associated-${mobile}`}
                    pageSize={6}
                    columns={[
                      { key: "mobileNumber", header: "Mobile number", render: (a) => <span className="num">{a.mobileNumber}</span> },
                      { key: "linkVia", header: "Linked via" },
                      { key: "complaints", header: "Complaints", align: "right" },
                      { key: "amount", header: "Amount", align: "right", render: (a) => <span className="num">{formatLac(a.amount)}</span> },
                      { key: "blockingStatus", header: "Blocking", render: (a) => <StatusChip>{a.blockingStatus}</StatusChip> },
                    ]}
                  />
                </Panel>
              </TabsContent>

              <TabsContent value="pos">
                {pos && (
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                    <Panel>
                      <PanelHeader icon={<Building2 className="size-4" />} title={pos.posName} subtitle={`PoS ${pos.posCode} · agent ${pos.posAgentName} (${pos.posAgentCode})`} />
                      <div className="grid gap-2 p-4 sm:grid-cols-2">
                        <Field label="Address" value={pos.posAddress} />
                        <Field label="District / LSA" value={`${pos.district} / ${pos.lsa}`} />
                        <Field label="TSP" value={pos.tsp} />
                        <Field label="Status of PoS" value={<StatusChip>{pos.statusOfPos}</StatusChip>} />
                        <Field label="Total SIMs issued" value={formatNumber(pos.totalSimsIssued)} />
                        <Field label="SIMs disconnected" value={formatNumber(pos.simsAlreadyDisconnected)} />
                        <Field label="Suspected SIMs" value={formatNumber(pos.suspectedSims)} />
                        <Field label="Date of action" value={pos.dateOfAction} />
                        <Field label="Action taken" value={pos.action} />
                      </div>
                    </Panel>
                    <Panel className="overflow-hidden">
                      <PanelHeader icon={<MapPinned className="size-4" />} title="PoS location" subtitle={`${pos.latitude}, ${pos.longitude}`} />
                      <GeoCanvas
                        height={300}
                        points={[{ id: pos.posCode, label: pos.posName, lat: pos.latitude, lng: pos.longitude, weight: pos.suspectedSims, meta: pos.posAddress }]}
                      />
                    </Panel>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="imei">
                <Panel>
                  <PanelHeader icon={<Smartphone className="size-4" />} title="Linked IMEI" subtitle="Handsets observed with this SIM" />
                  <DataTable
                    data={imeis}
                    exportName={`imei-${mobile}`}
                    pageSize={6}
                    columns={[
                      { key: "imeiNumber", header: "IMEI", render: (r) => <span className="num">{r.imeiNumber}</span> },
                      { key: "mobileNumber", header: "Mobile number", render: (r) => <span className="num">{r.mobileNumber}</span> },
                      { key: "dateOfSimInsert", header: "SIM insert" },
                      { key: "imeiBlockingStatus", header: "Blocking", render: (r) => <StatusChip>{r.imeiBlockingStatus}</StatusChip> },
                      { key: "imeiInternationalRoaming", header: "Intl. roaming", render: (r) => <StatusChip>{r.imeiInternationalRoaming}</StatusChip> },
                      { key: "plottedOnPratibimb", header: "Pratibimb", render: (r) => <StatusChip>{r.plottedOnPratibimb}</StatusChip> },
                    ]}
                  />
                </Panel>
              </TabsContent>

              <TabsContent value="blocking">
                {blocking && (
                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <Panel>
                      <PanelHeader icon={<Timer className="size-4" />} title="Blocking lifecycle" subtitle={`${blocking.tspLsa}`} />
                      <div className="p-5">
                        <TimelineStep label="Reported on NCRP" value={blocking.dateTimeOfReportingOnNcrp} />
                        <TimelineStep label="Request raised by State/District" value={blocking.dateTimeOfRequestSentForBlocking} />
                        <TimelineStep label="Request sent to TSP" value={blocking.dateTimeOfRequestSentToTsp} />
                        <TimelineStep label="Actual blocking" value={blocking.actualDateTimeOfBlocking} accent last />
                      </div>
                    </Panel>
                    <Panel>
                      <PanelHeader icon={<CalendarClock className="size-4" />} title="Turnaround analysis" />
                      <div className="grid gap-2 p-4 sm:grid-cols-2">
                        <Field label="Time taken by State/UT" value={blocking.timeTakenByState} />
                        <Field label="Time taken by TSP" value={blocking.timeTakenByTsp} />
                        <Field label="Total (reporting → blocking)" value={blocking.totalTimeTaken} />
                        <Field label="TSP / LSA" value={blocking.tspLsa} />
                      </div>
                    </Panel>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="roaming">
                <Panel>
                  <PanelHeader icon={<Globe2 className="size-4" />} title="International roaming" />
                  <DataTable
                    data={imeis.map((i) => ({
                      mobileNumber: mobile,
                      imeiNumber: i.imeiNumber,
                      dateOfRoaming: i.dateOfSimInsert,
                      country: row.internationalRoaming === "Yes" ? "United Arab Emirates" : "—",
                      simBlockingStatus: row.blockingStatus,
                      plottedOnPratibimb: row.plottedOnPratibimb,
                      duration: row.internationalRoaming === "Yes" ? "18 days" : "—",
                    }))}
                    exportName={`roaming-${mobile}`}
                    pageSize={5}
                    emptyLabel="This number has no international roaming footprint."
                    columns={[
                      { key: "mobileNumber", header: "Mobile number", render: (r) => <span className="num">{r.mobileNumber}</span> },
                      { key: "imeiNumber", header: "IMEI", render: (r) => <span className="num">{r.imeiNumber}</span> },
                      { key: "dateOfRoaming", header: "Date of roaming" },
                      { key: "country", header: "Roaming country" },
                      { key: "simBlockingStatus", header: "SIM blocking", render: (r) => <StatusChip>{r.simBlockingStatus}</StatusChip> },
                      { key: "plottedOnPratibimb", header: "Pratibimb", render: (r) => <StatusChip>{r.plottedOnPratibimb}</StatusChip> },
                      { key: "duration", header: "Duration" },
                    ]}
                  />
                </Panel>
              </TabsContent>

              <TabsContent value="samanvaya">
                <Panel>
                  <PanelHeader icon={<ShieldCheck className="size-4" />} title="Samanvaya suspect profile" subtitle={row.samanvayaProfile === "Yes" ? "Profile available on Samanvaya" : "No profile linked"} />
                  <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Profile ID" value={`SMV-${mobile.slice(-6)}`} />
                    <Field label="Suspect score" value={`${(60 + seeded(mobile) * 39).toFixed(0)} / 100`} />
                    <Field label="Linked cases" value={row.ncrpComplaints} />
                    <Field label="Linked bank accounts" value={2 + Math.floor(seeded(mobile, 2) * 5)} />
                    <Field label="Mule layer" value="Layer 1" />
                    <Field label="Last updated" value="14/05/2026" />
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="pratibimb">
                {pratibimb && (
                  <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
                    <Panel>
                      <PanelHeader icon={<Radio className="size-4" />} title="Pratibimb GIS profile" />
                      <div className="grid gap-2 p-4">
                        <Field label="Mobile no." value={pratibimb.mobileNo} />
                        <Field label="IMEI" value={pratibimb.imei} />
                        <Field label="Coordinates" value={pratibimb.coordinates} />
                        <Field label="Address" value={pratibimb.address} />
                        <Field label="Location fetch time" value={pratibimb.locationFetchTime} />
                        <Field label="Total complaints" value={pratibimb.totalComplaints} />
                        <Field label="NCRP complaint" value={pratibimb.ncrpComplaint} />
                      </div>
                    </Panel>
                    <Panel className="overflow-hidden">
                      <PanelHeader icon={<MapPinned className="size-4" />} title="Last known plot" subtitle={pratibimb.address} />
                      <GeoCanvas
                        height={330}
                        points={[
                          {
                            id: "pratibimb",
                            label: pratibimb.mobileNo,
                            lat: Number(pratibimb.coordinates.split(",")[0]),
                            lng: Number(pratibimb.coordinates.split(",")[1]),
                            weight: 10,
                            meta: pratibimb.address,
                          },
                        ]}
                      />
                    </Panel>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="supply">
                <Panel>
                  <PanelHeader icon={<Workflow className="size-4" />} title="SIM supply chain" subtitle="End-to-end custody trail" />
                  <div className="p-5">
                    {supplyChain.map((s, i) => (
                      <motion.div key={s.stage} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <TimelineStep label={`${s.when} · ${s.stage}`} value={s.detail} last={i === supplyChain.length - 1} accent={i === supplyChain.length - 1} />
                      </motion.div>
                    ))}
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="sdr">
                <Panel>
                  <PanelHeader
                    icon={<Signal className="size-4" />}
                    title="Subscriber data record (SDR)"
                    subtitle="Call detail extract shared by TSP under lawful request"
                    actions={
                      <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                        <Download className="size-3" /> Use export in table
                      </span>
                    }
                  />
                  <DataTable
                    data={sdr}
                    exportName={`sdr-${mobile}`}
                    pageSize={8}
                    dense
                    columns={[
                      { key: "callTime", header: "Timestamp" },
                      { key: "bParty", header: "B-party", render: (r) => <span className="num">{r.bParty}</span> },
                      { key: "type", header: "Type", render: (r) => <StatusChip tone="info">{r.type}</StatusChip> },
                      { key: "duration", header: "Duration", align: "right" },
                      { key: "imei", header: "IMEI", render: (r) => <span className="num">{r.imei}</span> },
                      { key: "cellSite", header: "Cell site" },
                    ]}
                  />
                </Panel>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {complaint && (
        <ComplaintDossier
          complaint={complaint}
          mobileNumber={mobile}
          open={!!complaint}
          onOpenChange={(v) => !v && setComplaint(null)}
        />
      )}
    </>
  );
}

export const DossierIcon = Fingerprint;
