import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Field } from "@/components/intel/Panel";
import { StatusChip } from "@/components/intel/StatusChip";
import { cn } from "@/lib/utils";
import {
  ENTITY_LABELS,
  complaintByAck,
  getComplaintsForMobile,
  getMobilesForPos,
  imeiByNumber,
  mobileByNumber,
  mobileRecords,
  operatorRecords,
  policeStationRecords,
  posByCode,
  complaintRecords,
  type EntityType,
} from "@/lib/intel";
import { CIRCULARS, OFFICERS } from "@/lib/directory";
import {
  formatLac,
  formatNumber,
  getBlocking,
  getDistricts,
  getPratibimb,
  stateRows,
} from "@/lib/telecom";

/* ------------------------------- context ---------------------------------- */

interface EntityRef {
  type: EntityType;
  id: string;
}

interface Ctx {
  open: (type: EntityType, id: string) => void;
}

const EntityCtx = createContext<Ctx>({ open: () => {} });

export const useEntityDrawer = () => useContext(EntityCtx);

export function EntityDrawerProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<EntityRef[]>([]);
  const open = useCallback((type: EntityType, id: string) => {
    setStack((s) => [...s, { type, id }]);
  }, []);
  const current = stack[stack.length - 1];
  const value = useMemo(() => ({ open }), [open]);

  return (
    <EntityCtx.Provider value={value}>
      {children}
      <Sheet
        open={!!current}
        onOpenChange={(o) => {
          if (!o) setStack([]);
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
          {current && (
            <>
              <SheetHeader className="sticky top-0 z-10 border-b border-border bg-surface-1/95 px-5 py-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  {stack.length > 1 && (
                    <button
                      onClick={() => setStack((s) => s.slice(0, -1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="size-3" /> Back
                    </button>
                  )}
                  <StatusChip tone="info">{ENTITY_LABELS[current.type]}</StatusChip>
                </div>
                <SheetTitle className="num truncate text-left text-base">{current.id.split("|").pop()}</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Linked intelligence record — every value below is navigable.
                </SheetDescription>
                <Link
                  to="/entity/$type/$id"
                  params={{ type: current.type, id: encodeURIComponent(current.id) }}
                  onClick={() => setStack([])}
                  className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary"
                >
                  <ExternalLink className="size-3.5" /> Open full investigation page
                </Link>
              </SheetHeader>
              <div className="space-y-5 px-5 py-5">
                <EntityBody type={current.type} id={current.id} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </EntityCtx.Provider>
  );
}

/* -------------------------------- link ------------------------------------- */

export function EntityLink({
  type,
  id,
  children,
  className,
  mono,
}: {
  type: EntityType;
  id: string;
  children?: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  const { open } = useEntityDrawer();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        open(type, id);
      }}
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-md text-left underline decoration-dotted decoration-primary/50 underline-offset-4 transition-colors hover:text-primary",
        mono && "num",
        className,
      )}
      title={`Open ${ENTITY_LABELS[type]} · ${id}`}
    >
      {children ?? id}
    </button>
  );
}

export function ChipLink({ type, id, label }: { type: EntityType; id: string; label?: ReactNode }) {
  const { open } = useEntityDrawer();
  return (
    <button
      type="button"
      onClick={() => open(type, id)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/70 px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary/50 hover:text-primary"
    >
      <span className="text-[9px] tracking-widest text-muted-foreground uppercase">{ENTITY_LABELS[type]}</span>
      <span className="num truncate">{label ?? id.split("|").pop()}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2">{children}</div>;
}

function Chips({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function QuickActions({ to, label, search }: { to: string; label: string; search?: Record<string, string> }) {
  return (
    <Section title="Quick actions">
      <Link
        to={to}
        search={search as never}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
      >
        <ExternalLink className="size-3.5" /> {label}
      </Link>
    </Section>
  );
}

/* -------------------------------- bodies ----------------------------------- */

export function EntityBody({ type, id }: { type: EntityType; id: string }) {
  switch (type) {
    case "mobile":
      return <MobileBody id={id} />;
    case "imei":
      return <ImeiBody id={id} />;
    case "complaint":
      return <ComplaintBody id={id} />;
    case "pos":
      return <PosBody id={id} />;
    case "operator":
      return <OperatorBody id={id} />;
    case "state":
      return <StateBody id={id} />;
    case "district":
      return <DistrictBody id={id} />;
    case "ps":
      return <PsBody id={id} />;
    case "circular":
      return <CircularBody id={id} />;
    case "officer":
      return <OfficerBody id={id} />;
    default:
      return <PersonBody id={id} kind={type === "victim" ? "victim" : "suspect"} />;
  }
}

function Empty({ what }: { what: string }) {
  return <p className="text-xs text-muted-foreground">No {what} linked to this record.</p>;
}

function MobileBody({ id }: { id: string }) {
  const m = mobileByNumber.get(id);
  if (!m) return <Empty what="details" />;
  const complaints = getComplaintsForMobile(id);
  const blocking = getBlocking(id);
  const prat = getPratibimb(id);
  return (
    <>
      <Section title="Identity & posture">
        <Grid>
          <Field label="Mobile number" value={<span className="num">{m.mobileNumber}</span>} />
          <Field label="Operator" value={<EntityLink type="operator" id={m.operator} />} />
          <Field label="Blocking status" value={<StatusChip>{m.blockingStatus}</StatusChip>} />
          <Field label="Blocking date" value={<span className="num">{m.blockingDate}</span>} />
          <Field label="NCRP complaints" value={<span className="num">{m.ncrpComplaints}</span>} />
          <Field label="Associated suspect numbers" value={<span className="num">{m.associatedSuspectNumbers}</span>} />
          <Field label="Total amount involved" value={<span className="num">{formatLac(m.totalAmountInvolvedLac)}</span>} />
          <Field label="Linked IMEI" value={<span className="num">{m.linkedImei}</span>} />
          <Field label="Point of sale" value={<EntityLink type="pos" id={m.posCode} mono />} />
          <Field label="International roaming" value={<StatusChip>{m.internationalRoaming}</StatusChip>} />
          <Field label="SAMANVAYA profile" value={<StatusChip>{m.samanvayaProfile}</StatusChip>} />
          <Field label="Plotted on Pratibimb" value={<StatusChip>{m.plottedOnPratibimb}</StatusChip>} />
          <Field label="DoT flag" value={<StatusChip>{m.dotFlag}</StatusChip>} />
          <Field label="SIM supply chain" value={m.simSupplyChain} />
          <Field label="SDR" value={m.sdr} />
          <Field label="Risk band" value={<StatusChip tone={m.riskLevel === "High Risk" ? "danger" : m.riskLevel === "Medium Risk" ? "warning" : "success"}>{m.riskLevel}</StatusChip>} />
        </Grid>
      </Section>

      <Section title="Technical sync">
        <Grid>
          <Field label="CEIR status" value={m.ceirStatus} />
          <Field label="DoT status" value={m.dotStatus} />
          <Field label="Sync status" value={m.syncStatus} />
          <Field label="Last updated" value={<span className="num">{m.lastUpdated}</span>} />
          <Field label="Device brand" value={m.deviceBrand} />
          <Field label="Device model" value={m.deviceModel} />
        </Grid>
      </Section>

      <Section title="Case profile">
        <Grid>
          <Field label="Category" value={m.category} />
          <Field label="Subcategory" value={m.subcategory} />
          <Field label="Fraud type" value={m.fraudType} />
          <Field label="FIR status" value={<StatusChip>{m.firStatus}</StatusChip>} />
          <Field label="Chargesheet" value={<StatusChip>{m.chargesheetStatus}</StatusChip>} />
          <Field label="Investigation" value={<StatusChip>{m.investigationStatus}</StatusChip>} />
          <Field label="Victim" value={<EntityLink type="victim" id={m.victimName} />} />
          <Field label="Suspect" value={<EntityLink type="suspect" id={m.suspectName} />} />
          <Field label="Bank" value={m.bank} />
          <Field label="Wallet" value={m.wallet} />
          <Field label="Account type" value={m.accountType} />
          <Field label="Victim profile" value={`${m.victimGender} · ${m.victimAgeGroup}`} />
        </Grid>
      </Section>

      <Section title="Jurisdiction">
        <Chips>
          <ChipLink type="state" id={m.state} />
          <ChipLink type="district" id={`${m.state}|${m.district}`} label={m.district} />
          <ChipLink type="ps" id={`${m.state}|${m.district}|${m.policeStation}`} label={m.policeStation} />
          <ChipLink type="operator" id={m.operator} />
        </Chips>
      </Section>

      <Section title={`Linked IMEI (${m.imeis.length})`}>
        <Chips>
          {m.imeis.map((i) => (
            <ChipLink key={i.imeiNumber} type="imei" id={i.imeiNumber} />
          ))}
        </Chips>
      </Section>

      <Section title={`Linked complaints (${complaints.length})`}>
        {complaints.length ? (
          <div className="space-y-1.5">
            {complaints.slice(0, 8).map((c) => (
              <div key={c.ackNumber} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-xs">
                <EntityLink type="complaint" id={c.ackNumber} mono />
                <span className="num text-muted-foreground">{formatLac(c.amountInvolved)}</span>
                <StatusChip>{c.status}</StatusChip>
              </div>
            ))}
          </div>
        ) : (
          <Empty what="complaints" />
        )}
      </Section>

      {blocking && (
        <Section title="Blocking timeline">
          <Grid>
            <Field label="TSP / LSA" value={blocking.tspLsa} />
            <Field label="Reported on NCRP" value={<span className="num">{blocking.dateTimeOfReportingOnNcrp}</span>} />
            <Field label="Request sent for blocking" value={<span className="num">{blocking.dateTimeOfRequestSentForBlocking}</span>} />
            <Field label="Request sent to TSP" value={<span className="num">{blocking.dateTimeOfRequestSentToTsp}</span>} />
            <Field label="Actual blocking" value={<span className="num">{blocking.actualDateTimeOfBlocking}</span>} />
            <Field label="Time taken by state" value={blocking.timeTakenByState} />
            <Field label="Time taken by TSP" value={blocking.timeTakenByTsp} />
            <Field label="Total time taken" value={blocking.totalTimeTaken} />
          </Grid>
        </Section>
      )}

      {prat && (
        <Section title="Pratibimb GIS profile">
          <Grid>
            <Field label="Mobile (E.164)" value={<span className="num">{prat.mobileNo}</span>} />
            <Field label="IMEI" value={<span className="num">{prat.imei}</span>} />
            <Field label="Coordinates" value={<span className="num">{prat.coordinates}</span>} />
            <Field label="Location fetch time" value={<span className="num">{prat.locationFetchTime}</span>} />
            <Field label="Total complaints" value={<span className="num">{prat.totalComplaints}</span>} />
            <Field label="Address" value={prat.address} />
            <Field label="NCRP complaint" value={prat.ncrpComplaint} />
          </Grid>
        </Section>
      )}

      <QuickActions to="/registry" label="Open in suspect registry" />
    </>
  );
}

function ImeiBody({ id }: { id: string }) {
  const i = imeiByNumber.get(id);
  if (!i) return <Empty what="details" />;
  const complaints = getComplaintsForMobile(i.mobileNumber);
  const blocking = getBlocking(i.mobileNumber);
  return (
    <>
      <Section title="Handset record">
        <Grid>
          <Field label="IMEI number" value={<span className="num">{i.imeiNumber}</span>} />
          <Field label="Linked mobile" value={<EntityLink type="mobile" id={i.mobileNumber} mono />} />
          <Field label="Date of SIM insert" value={<span className="num">{i.dateOfSimInsert}</span>} />
          <Field label="IMEI blocking status" value={<StatusChip>{i.imeiBlockingStatus}</StatusChip>} />
          <Field label="International roaming" value={<StatusChip>{i.imeiInternationalRoaming}</StatusChip>} />
          <Field label="Plotted on Pratibimb" value={<StatusChip>{i.plottedOnPratibimb}</StatusChip>} />
          <Field label="Device brand" value={i.deviceBrand} />
          <Field label="Device model" value={i.deviceModel} />
          <Field label="CEIR status" value={i.ceirStatus} />
          <Field label="DoT status" value={i.dotStatus} />
        </Grid>
      </Section>
      <Section title="Linked entities">
        <Chips>
          <ChipLink type="mobile" id={i.mobileNumber} />
          <ChipLink type="operator" id={i.operator} />
          <ChipLink type="state" id={i.state} />
          <ChipLink type="district" id={`${i.state}|${i.district}`} label={i.district} />
          <ChipLink type="ps" id={`${i.state}|${i.district}|${i.policeStation}`} label={i.policeStation} />
          {complaints.slice(0, 4).map((c) => (
            <ChipLink key={c.ackNumber} type="complaint" id={c.ackNumber} />
          ))}
        </Chips>
      </Section>
      {blocking && (
        <Section title="Blocking timeline">
          <Grid>
            <Field label="Reported on NCRP" value={<span className="num">{blocking.dateTimeOfReportingOnNcrp}</span>} />
            <Field label="Request to TSP" value={<span className="num">{blocking.dateTimeOfRequestSentToTsp}</span>} />
            <Field label="Actual blocking" value={<span className="num">{blocking.actualDateTimeOfBlocking}</span>} />
            <Field label="Total time taken" value={blocking.totalTimeTaken} />
          </Grid>
        </Section>
      )}
      <QuickActions to="/imei" label="Open IMEI dashboard" />
    </>
  );
}

function ComplaintBody({ id }: { id: string }) {
  const c = complaintByAck.get(id);
  if (!c) return <Empty what="details" />;
  const related = complaintRecords.filter((r) => r.mobileNumber === c.mobileNumber && r.ackNumber !== c.ackNumber);
  return (
    <>
      <Section title="Complaint">
        <Grid>
          <Field label="Acknowledgement no." value={<span className="num">{c.ackNumber}</span>} />
          <Field label="Mobile number" value={<EntityLink type="mobile" id={c.mobileNumber} mono />} />
          <Field label="Amount involved" value={<span className="num">{formatLac(c.amountInvolved)}</span>} />
          <Field label="Status" value={<StatusChip>{c.status}</StatusChip>} />
          <Field label="Date reported" value={<span className="num">{c.dateReported}</span>} />
          <Field label="Incident date" value={<span className="num">{c.incidentDate}</span>} />
          <Field label="Last updated" value={<span className="num">{c.lastUpdated}</span>} />
          <Field label="Risk band" value={<StatusChip tone={c.riskLevel === "High Risk" ? "danger" : c.riskLevel === "Medium Risk" ? "warning" : "success"}>{c.riskLevel}</StatusChip>} />
          <Field label="Category" value={c.category} />
          <Field label="Subcategory" value={c.subcategory} />
          <Field label="Fraud type" value={c.fraudType} />
          <Field label="FIR status" value={<StatusChip>{c.firStatus}</StatusChip>} />
          <Field label="Chargesheet" value={<StatusChip>{c.chargesheetStatus}</StatusChip>} />
          <Field label="Investigation" value={<StatusChip>{c.investigationStatus}</StatusChip>} />
        </Grid>
      </Section>
      <Section title="Parties & money trail">
        <Grid>
          <Field label="Victim" value={<EntityLink type="victim" id={c.victimName} />} />
          <Field label="Victim profile" value={`${c.victimGender} · ${c.victimAgeGroup}`} />
          <Field label="Suspect" value={<EntityLink type="suspect" id={c.suspectName} />} />
          <Field label="Bank" value={c.bank} />
          <Field label="Wallet" value={c.wallet} />
          <Field label="Account type" value={c.accountType} />
        </Grid>
      </Section>
      <Section title="Linked entities">
        <Chips>
          <ChipLink type="mobile" id={c.mobileNumber} />
          <ChipLink type="imei" id={c.imeiNumber} />
          <ChipLink type="operator" id={c.operator} />
          <ChipLink type="state" id={c.state} />
          <ChipLink type="district" id={`${c.state}|${c.district}`} label={c.district} />
          <ChipLink type="ps" id={`${c.state}|${c.district}|${c.policeStation}`} label={c.policeStation} />
        </Chips>
      </Section>
      <Section title={`Related complaints (${related.length})`}>
        {related.length ? (
          <Chips>
            {related.slice(0, 10).map((r) => (
              <ChipLink key={r.ackNumber} type="complaint" id={r.ackNumber} />
            ))}
          </Chips>
        ) : (
          <Empty what="related complaints" />
        )}
      </Section>
      <QuickActions to="/mobile/archive" label="Open complaint archive" />
    </>
  );
}

function PosBody({ id }: { id: string }) {
  const p = posByCode.get(id);
  if (!p) return <Empty what="details" />;
  const numbers = getMobilesForPos(id);
  return (
    <>
      <Section title="Point of sale">
        <Grid>
          <Field label="PoS code" value={<span className="num">{p.posCode}</span>} />
          <Field label="PoS name" value={p.posName} />
          <Field label="Agent code" value={<span className="num">{p.posAgentCode}</span>} />
          <Field label="Agent name" value={p.posAgentName} />
          <Field label="Address" value={p.posAddress} />
          <Field label="District" value={<EntityLink type="district" id={`${p.lsa}|${p.district}`}>{p.district}</EntityLink>} />
          <Field label="LSA" value={<EntityLink type="state" id={p.lsa} />} />
          <Field label="TSP" value={<EntityLink type="operator" id={p.tsp} />} />
          <Field label="Latitude" value={<span className="num">{p.latitude}</span>} />
          <Field label="Longitude" value={<span className="num">{p.longitude}</span>} />
          <Field label="Total SIMs issued" value={<span className="num">{formatNumber(p.totalSimsIssued)}</span>} />
          <Field label="SIMs disconnected" value={<span className="num">{formatNumber(p.simsAlreadyDisconnected)}</span>} />
          <Field label="Suspected SIMs" value={<span className="num">{formatNumber(p.suspectedSims)}</span>} />
          <Field label="Status of PoS" value={<StatusChip>{p.statusOfPos}</StatusChip>} />
          <Field label="Date of action" value={<span className="num">{p.dateOfAction}</span>} />
          <Field label="Action" value={p.action} />
          <Field label="Circle" value={p.circle} />
          <Field label="Risk band" value={<StatusChip tone={p.riskLevel === "High Risk" ? "danger" : p.riskLevel === "Medium Risk" ? "warning" : "success"}>{p.riskLevel}</StatusChip>} />
        </Grid>
      </Section>
      <Section title={`SIMs issued to suspects (${numbers.length})`}>
        {numbers.length ? (
          <Chips>
            {numbers.map((m) => (
              <ChipLink key={m.mobileNumber} type="mobile" id={m.mobileNumber} />
            ))}
          </Chips>
        ) : (
          <Empty what="numbers" />
        )}
      </Section>
      <QuickActions to="/pos" label="Open SIM PoS dashboard" />
    </>
  );
}

function OperatorBody({ id }: { id: string }) {
  const o = operatorRecords.find((x) => x.tsp === id);
  if (!o) return <Empty what="details" />;
  return (
    <>
      <Section title="Telecom service provider">
        <Grid>
          <Field label="Operator" value={o.tsp} />
          <Field label="Suspect numbers" value={<span className="num">{formatNumber(o.totalNumbers)}</span>} />
          <Field label="Blocked" value={<span className="num text-emerald">{formatNumber(o.blocked)}</span>} />
          <Field label="Not blocked" value={<span className="num text-destructive">{formatNumber(o.notBlocked)}</span>} />
          <Field label="Plotted on Pratibimb" value={<span className="num">{formatNumber(o.pratibimb)}</span>} />
          <Field label="Amount involved" value={<span className="num">{formatLac(o.amount)}</span>} />
          <Field label="Points of sale" value={<span className="num">{formatNumber(o.pos)}</span>} />
        </Grid>
      </Section>
      <Section title="Suspect numbers on this network">
        <Chips>
          {o.numbers.slice(0, 24).map((m) => (
            <ChipLink key={m.state + m.district + m.mobileNumber} type="mobile" id={m.mobileNumber} />
          ))}
        </Chips>
      </Section>
      <QuickActions to="/mobile/performance" label="Open TSP performance report" />
    </>
  );
}

function StateBody({ id }: { id: string }) {
  const s = stateRows.find((x) => x.state === id);
  if (!s) return <Empty what="details" />;
  const districts = getDistricts(id);
  return (
    <>
      <Section title="State / LSA posture">
        <Grid>
          <Field label="State" value={s.state} />
          <Field label="Total suspect numbers" value={<span className="num">{formatNumber(s.totalSuspectNumbers)}</span>} />
          <Field label="Blocked" value={<span className="num text-emerald">{formatNumber(s.blocked)}</span>} />
          <Field label="Not blocked" value={<span className="num text-destructive">{formatNumber(s.notBlocked)}</span>} />
          <Field label="Plotted on Pratibimb" value={<span className="num">{formatNumber(s.plottedOnPratibimb)}</span>} />
          <Field label="Districts covered" value={<span className="num">{districts.length}</span>} />
        </Grid>
      </Section>
      <Section title="Districts">
        {districts.length ? (
          <Chips>
            {districts.map((d) => (
              <ChipLink key={d.district} type="district" id={`${id}|${d.district}`} label={d.district} />
            ))}
          </Chips>
        ) : (
          <Empty what="districts" />
        )}
      </Section>
      <Section title="Nodal officers">
        <Chips>
          {OFFICERS.filter((o) => o.state === id).map((o) => (
            <ChipLink key={o.id} type="officer" id={o.id} label={o.name} />
          ))}
        </Chips>
      </Section>
      <QuickActions to="/" label="Filter dashboard by this state" search={{ state: id }} />
    </>
  );
}

function DistrictBody({ id }: { id: string }) {
  const [state, district] = id.split("|");
  const d = getDistricts(state).find((x) => x.district === district);
  const numbers = mobileRecords.filter((m) => m.state === state && m.district === district);
  const stations = policeStationRecords.filter((p) => p.state === state && p.district === district);
  return (
    <>
      <Section title="District posture">
        <Grid>
          <Field label="District" value={district} />
          <Field label="State" value={<EntityLink type="state" id={state} />} />
          <Field label="Total suspect numbers" value={<span className="num">{formatNumber(d?.totalSuspectNumbers ?? numbers.length)}</span>} />
          <Field label="Blocked" value={<span className="num text-emerald">{formatNumber(d?.blocked ?? 0)}</span>} />
          <Field label="Not blocked" value={<span className="num text-destructive">{formatNumber(d?.notBlocked ?? 0)}</span>} />
          <Field label="Plotted on Pratibimb" value={<span className="num">{formatNumber(d?.plottedOnPratibimb ?? 0)}</span>} />
        </Grid>
      </Section>
      <Section title={`Police stations (${stations.length})`}>
        <Chips>
          {stations.map((p) => (
            <ChipLink key={p.policeStation} type="ps" id={`${state}|${district}|${p.policeStation}`} label={p.policeStation} />
          ))}
        </Chips>
      </Section>
      <Section title={`Suspect numbers (${numbers.length})`}>
        <Chips>
          {numbers.map((m) => (
            <ChipLink key={m.mobileNumber} type="mobile" id={m.mobileNumber} />
          ))}
        </Chips>
      </Section>
      <QuickActions to="/registry" label="Explore hierarchy" />
    </>
  );
}

function PsBody({ id }: { id: string }) {
  const [state, district, ps] = id.split("|");
  const numbers = mobileRecords.filter((m) => m.state === state && m.district === district && m.policeStation === ps);
  const complaints = complaintRecords.filter((c) => c.policeStation === ps && c.district === district);
  return (
    <>
      <Section title="Police station">
        <Grid>
          <Field label="Police station" value={ps} />
          <Field label="District" value={<EntityLink type="district" id={`${state}|${district}`}>{district}</EntityLink>} />
          <Field label="State" value={<EntityLink type="state" id={state} />} />
          <Field label="Suspect numbers" value={<span className="num">{numbers.length}</span>} />
          <Field label="Complaints" value={<span className="num">{complaints.length}</span>} />
          <Field label="Amount involved" value={<span className="num">{formatLac(complaints.reduce((a, c) => a + c.amountInvolved, 0))}</span>} />
        </Grid>
      </Section>
      <Section title="Register">
        <Chips>
          {numbers.map((m) => (
            <ChipLink key={m.mobileNumber} type="mobile" id={m.mobileNumber} />
          ))}
          {complaints.slice(0, 12).map((c) => (
            <ChipLink key={c.ackNumber} type="complaint" id={c.ackNumber} />
          ))}
        </Chips>
      </Section>
      <QuickActions to="/registry" label="Open suspect registry" />
    </>
  );
}

function CircularBody({ id }: { id: string }) {
  const c = CIRCULARS.find((x) => x.id === id);
  if (!c) return <Empty what="details" />;
  return (
    <>
      <Section title="Circular">
        <Grid>
          <Field label="Reference" value={<span className="num">{c.id}</span>} />
          <Field label="Category" value={c.category} />
          <Field label="Priority" value={<StatusChip tone={c.priority === "Critical" ? "danger" : c.priority === "High" ? "warning" : "neutral"}>{c.priority}</StatusChip>} />
          <Field label="Issued by" value={c.issuedBy} />
          <Field label="Date" value={<span className="num">{c.date}</span>} />
          <Field label="Pages" value={<span className="num">{c.pages}</span>} />
          <Field label="Pinned" value={c.pinned ? "Yes" : "No"} />
        </Grid>
      </Section>
      <Section title="Title">
        <p className="text-sm font-medium">{c.title}</p>
      </Section>
      <Section title="Summary">
        <p className="text-xs leading-relaxed text-muted-foreground">{c.summary}</p>
      </Section>
      <QuickActions to="/circulars" label="Open circular library" />
    </>
  );
}

function OfficerBody({ id }: { id: string }) {
  const o = OFFICERS.find((x) => x.id === id);
  if (!o) return <Empty what="details" />;
  return (
    <>
      <Section title="Officer">
        <Grid>
          <Field label="Name" value={o.name} />
          <Field label="Designation" value={o.designation} />
          <Field label="Department" value={o.department} />
          <Field label="State" value={<EntityLink type="state" id={o.state} />} />
          <Field label="Phone" value={<a className="num underline decoration-dotted" href={`tel:${o.phone}`}>{o.phone}</a>} />
          <Field label="Email" value={<a className="underline decoration-dotted" href={`mailto:${o.email}`}>{o.email}</a>} />
          <Field label="Category" value={<StatusChip tone="info">{o.category}</StatusChip>} />
        </Grid>
      </Section>
      <QuickActions to={o.category === "Nodal Officer" ? "/contacts/nodal" : "/contacts/dot"} label="Open contact directory" />
    </>
  );
}

function PersonBody({ id, kind }: { id: string; kind: "victim" | "suspect" }) {
  const linked = complaintRecords.filter((c) => (kind === "victim" ? c.victimName : c.suspectName) === id);
  const first = linked[0];
  if (!first) return <Empty what="records" />;
  return (
    <>
      <Section title={kind === "victim" ? "Victim profile" : "Suspect profile"}>
        <Grid>
          <Field label="Name" value={id} />
          <Field label="Gender" value={first.victimGender} />
          <Field label="Age group" value={first.victimAgeGroup} />
          <Field label="Bank" value={first.bank} />
          <Field label="Wallet" value={first.wallet} />
          <Field label="Account type" value={first.accountType} />
          <Field label="Cases" value={<span className="num">{linked.length}</span>} />
          <Field label="Total exposure" value={<span className="num">{formatLac(linked.reduce((a, c) => a + c.amountInvolved, 0))}</span>} />
        </Grid>
      </Section>
      <Section title="Linked complaints">
        <Chips>
          {linked.slice(0, 16).map((c) => (
            <ChipLink key={c.ackNumber} type="complaint" id={c.ackNumber} />
          ))}
        </Chips>
      </Section>
      <Section title="Linked numbers">
        <Chips>
          {Array.from(new Set(linked.map((c) => c.mobileNumber))).map((n) => (
            <ChipLink key={n} type="mobile" id={n} />
          ))}
        </Chips>
      </Section>
    </>
  );
}

export { X as _X };
