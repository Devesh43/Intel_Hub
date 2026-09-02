import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Building2, Landmark, MapPin, Phone } from "lucide-react";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { DataTable } from "@/components/intel/DataTable";
import { StatusChip } from "@/components/intel/StatusChip";
import { MobileDossier } from "@/components/dossier/MobileDossier";
import {
  formatLac,
  formatNumber,
  getDistricts,
  getPoliceStations,
  getPsRows,
  stateRows,
  type PsMobileRow,
} from "@/lib/telecom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Level = "state" | "district" | "ps" | "numbers";

export function HierarchyExplorer({ initialState, scopeLabel }: { initialState?: string; scopeLabel?: string }) {
  const [state, setState] = useState<string | null>(initialState ?? null);
  const [district, setDistrict] = useState<string | null>(null);
  const [ps, setPs] = useState<string | null>(null);
  const [row, setRow] = useState<PsMobileRow | null>(null);

  const level: Level = !state ? "state" : !district ? "district" : !ps ? "ps" : "numbers";

  const crumbs = [
    { label: scopeLabel ?? "All states", onClick: () => { setState(null); setDistrict(null); setPs(null); } },
    state ? { label: state, onClick: () => { setDistrict(null); setPs(null); } } : null,
    district ? { label: district, onClick: () => setPs(null) } : null,
    ps ? { label: ps } : null,
  ].filter(Boolean) as { label: string; onClick?: () => void }[];

  const numericCols = [
    { key: "totalSuspectNumbers", header: "Suspect numbers", align: "right" as const, render: (r: any) => <span className="num text-primary">{formatNumber(r.totalSuspectNumbers)}</span> },
    { key: "blocked", header: "Blocked", align: "right" as const, render: (r: any) => <span className="num text-emerald">{formatNumber(r.blocked)}</span> },
    { key: "notBlocked", header: "Not blocked", align: "right" as const, render: (r: any) => <span className="num text-destructive">{formatNumber(r.notBlocked)}</span> },
    { key: "plottedOnPratibimb", header: "Plotted on Pratibimb", align: "right" as const, render: (r: any) => <span className="num text-cyan">{formatNumber(r.plottedOnPratibimb)}</span> },
  ];

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        icon={<Landmark className="size-4" />}
        title="State → District → Police Station → Number drill-down"
        subtitle="Every figure is hyperlinked, exactly as defined in the telecom module workflow"
        actions={
          <nav className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={c.label + i} className="inline-flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 opacity-60" />}
                {c.onClick ? (
                  <button onClick={c.onClick} className="transition-colors hover:text-primary">
                    {c.label}
                  </button>
                ) : (
                  <span className="text-foreground">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        }
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={level + state + district + ps}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {level === "state" && (
            <DataTable
              data={stateRows}
              exportName="state-wise-suspect-numbers"
              pageSize={8}
              onRowClick={(r) => setState(r.state)}
              searchPlaceholder="Search state / LSA…"
              columns={[
                { key: "state", header: "State / LSA", render: (r) => (<span className="inline-flex items-center gap-2 font-medium"><MapPin className="size-3.5 text-primary" />{r.state}</span>) },
                ...numericCols,
              ]}
            />
          )}

          {level === "district" && state && (
            <DataTable
              data={getDistricts(state)}
              exportName={`district-wise-${state}`}
              pageSize={8}
              onRowClick={(r) => setDistrict(r.district)}
              searchPlaceholder={`Search districts in ${state}…`}
              emptyLabel={`No district breakdown published for ${state} yet.`}
              columns={[
                { key: "district", header: "District", render: (r) => (<span className="inline-flex items-center gap-2 font-medium"><Building2 className="size-3.5 text-primary" />{r.district}</span>) },
                ...numericCols,
              ]}
            />
          )}

          {level === "ps" && state && district && (
            <DataTable
              data={getPoliceStations(state, district)}
              exportName={`ps-wise-${district}`}
              pageSize={8}
              onRowClick={(r) => setPs(r.policeStation)}
              searchPlaceholder={`Search police stations in ${district}…`}
              columns={[
                { key: "policeStation", header: "Police station", render: (r) => (<span className="inline-flex items-center gap-2 font-medium"><Landmark className="size-3.5 text-primary" />{r.policeStation}</span>) },
                ...numericCols,
              ]}
            />
          )}

          {level === "numbers" && district && (
            <DataTable
              data={getPsRows(district)}
              exportName={`ps-wise-numbers-${district}`}
              pageSize={8}
              onRowClick={(r) => setRow(r)}
              searchPlaceholder="Search suspect mobile numbers…"
              columns={[
                { key: "mobileNumber", header: "Mobile number", render: (r) => (<span className="num inline-flex items-center gap-2 font-medium text-primary"><Phone className="size-3.5" />{r.mobileNumber}</span>) },
                { key: "ncrpComplaints", header: "NCRP complaints", align: "right" },
                { key: "associatedSuspectNumbers", header: "Associated numbers", align: "right" },
                { key: "totalAmountInvolvedLac", header: "Amount involved", align: "right", render: (r) => <span className="num">{formatLac(r.totalAmountInvolvedLac)}</span> },
                { key: "posCode", header: "PoS code", render: (r) => <span className="num">{r.posCode}</span> },
                { key: "linkedImei", header: "Linked IMEI", align: "right" },
                { key: "blockingStatus", header: "Blocking", render: (r) => <StatusChip>{r.blockingStatus}</StatusChip> },
                { key: "internationalRoaming", header: "Intl. roaming", render: (r) => <StatusChip>{r.internationalRoaming}</StatusChip> },
                { key: "samanvayaProfile", header: "Samanvaya", render: (r) => <StatusChip>{r.samanvayaProfile}</StatusChip> },
                { key: "plottedOnPratibimb", header: "Pratibimb", render: (r) => <StatusChip>{r.plottedOnPratibimb}</StatusChip> },
                { key: "dotFlag", header: "DoT flag", render: (r) => <StatusChip>{r.dotFlag}</StatusChip> },
                { key: "simSupplyChain", header: "SIM supply chain", sortable: false, render: () => <span className="text-xs text-primary">View / make request</span> },
                { key: "sdr", header: "SDR", sortable: false, render: () => <span className="text-xs text-primary">Click to view SDR</span> },
              ]}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {row && (
        <MobileDossier
          row={row}
          open={!!row}
          onOpenChange={(v: boolean) => !v && setRow(null)}
          context={{ state: state ?? undefined, district: district ?? undefined, policeStation: ps ?? undefined }}
        />
      )}
    </Panel>
  );
}

export function HierarchyDialog({
  open,
  onOpenChange,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(1180px,96vw)] overflow-y-auto p-0 sm:max-w-[min(1180px,96vw)]">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
        </DialogHeader>
        <div className="p-5">
          <HierarchyExplorer />
        </div>
      </DialogContent>
    </Dialog>
  );
}
