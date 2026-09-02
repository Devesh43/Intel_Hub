import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { PageHeader } from "@/components/intel/PageHeader";
import { AlertBanner } from "@/components/intel/AlertBanner";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { IndiaMap } from "@/components/intel/IndiaMap";
import { DonutStat, StackedBars, TrendArea, Treemap } from "@/components/intel/Charts";
import { StatusChip } from "@/components/intel/StatusChip";
import { FilterPanel } from "@/components/intel/FilterPanel";
import { GlobalSearchTable } from "@/components/intel/GlobalSearchTable";
import { SummaryTiles } from "@/components/intel/SummaryTiles";
import {
  ComplaintRecordsPanel,
  MobileRecordsPanel,
  useFilteredMobiles,
} from "@/components/intel/RecordTables";
import { useEntityDrawer } from "@/components/intel/EntityLinks";
import { useApplyFilter, useIntelFilters } from "@/lib/filter-context";
import { mobileRecords, RISKS } from "@/lib/intel";
import { formatNumber, mobileTiles, monthlySeries, stateRows } from "@/lib/telecom";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ state: (s.state as string) || undefined }),
  head: () => ({
    meta: [
      { title: "Mobile Number Dashboard | NCRP Telecom Intelligence" },
      { name: "description", content: "Suspect mobile numbers reported on NCRP with state, district and police-station drill-downs, blocking status and Pratibimb plots." },
      { property: "og:title", content: "Mobile Number Dashboard | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Live suspect mobile number intelligence, blocking lifecycle and Pratibimb GIS plots." },
    ],
  }),
  component: MobileDashboard,
});

function MobileDashboard() {
  const { state } = Route.useSearch();
  const { filters, setFilters, range, setRange } = useIntelFilters();
  const apply = useApplyFilter();
  const navigate = useNavigate();
  const { open } = useEntityDrawer();
  const registryRef = useRef<HTMLDivElement>(null);
  const filtered = useFilteredMobiles();

  const scrollToRegistry = () =>
    registryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const stateValues = useMemo(() => {
    const out: Record<string, { total: number; blocked: number; notBlocked: number; plotted: number }> = {};
    stateRows.forEach((s) => {
      out[s.state] = {
        total: s.totalSuspectNumbers,
        blocked: s.blocked,
        notBlocked: s.notBlocked,
        plotted: s.plottedOnPratibimb,
      };
    });
    return out;
  }, []);

  const districtValues = useMemo(() => {
    const out: Record<string, { total: number; blocked: number }> = {};
    mobileRecords.forEach((m) => {
      const k = `${m.state}|${m.district}`;
      const cur = out[k] ?? { total: 0, blocked: 0 };
      cur.total += 1;
      if (m.blockingStatus === "Blocked") cur.blocked += 1;
      out[k] = cur;
    });
    return out;
  }, []);

  const riskSplit = useMemo(
    () =>
      RISKS.map((r, i) => ({
        name: r,
        value: filtered.filter((m) => m.riskLevel === r).length,
        color: `var(--chart-${i + 1})`,
      })),
    [filtered],
  );

  return (
    <>
      <PageHeader
        title="Mobile Number Dashboard"
        description="Suspect telecom identifiers reported on NCRP · MHA workflow"
        crumbs={[{ label: "Telecom Module" }, { label: "Mobile Number" }, { label: "Dashboard" }]}
        meta={
          <>
            <StatusChip tone="success" dot onClick={scrollToRegistry} title="Jump to live records">NCRP live feed</StatusChip>
            <StatusChip tone="info" onClick={() => apply("ceirStatus", "CEIR Barred", "CEIR barred")}>CEIR gateway online</StatusChip>
            <StatusChip tone="violet" onClick={() => apply("plottedOnPratibimb", "Yes", "Pratibimb plotted")}>Pratibimb GIS API online</StatusChip>
            <StatusChip tone="warning" onClick={() => navigate({ to: "/contacts/dot" })}>TSP: Jio · Airtel · VI · BSNL</StatusChip>
          </>
        }
      />

      <AlertBanner
        title="LEA emergency protocol active"
        message="High threat indicators in hotspot clusters pushed live to regional TSP circles. Verify biometrics before suspension."
        details={[
          { label: "Hotspots", value: "Jamtara · Nuh · Mewat" },
          { label: "New suspects (6h)", value: "42" },
          { label: "SLA breaches", value: "3" },
          { label: "Escalations", value: "DoT Task Force" },
        ]}
      />

      <GlobalSearchTable />

      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        range={range}
        setRange={setRange}
        matched={filtered.length}
        total={mobileRecords.length}
      />

      <SummaryTiles tiles={mobileTiles} onOpenRecords={scrollToRegistry} />

      <div ref={registryRef}>
        <MobileRecordsPanel
          title="Segregated suspect number registry"
          subtitle="Every identifier, badge and figure is clickable — badges segregate, identifiers open dossiers"
          rows={filtered}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Reporting vs blocking trend"
            subtitle="Rolling 12 months · click a month to inspect it"
          />
          <TrendArea
            data={monthlySeries("mobile-trend", mobileTiles[0].value)}
            onSelect={(row) => row?.month && apply("investigationStatus", "Active", `Active cases · ${row.month}`)}
            keys={[
              { key: "reported", label: "Reported", color: "var(--chart-1)" },
              { key: "blocked", label: "Blocked", color: "var(--chart-4)" },
              { key: "plotted", label: "Pratibimb plots", color: "var(--chart-2)" },
            ]}
          />
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHeader title="Risk split of matched records" subtitle="Click a slice to segregate by risk band" />
          <DonutStat data={riskSplit} onSelect={(name) => apply("riskLevel", name, name)} />
        </Panel>
      </div>

      <Panel className="mb-6 overflow-hidden">
        <PanelHeader
          title="Interactive map of India"
          subtitle="Choropleth of suspect volume — click a state to drill into its districts"
          actions={<StatusChip tone="info">{formatNumber(stateRows.length)} reporting states</StatusChip>}
        />
        <IndiaMap
          stateValues={stateValues}
          districtValues={districtValues}
          activeState={state}
          onSelectState={(s) => open("state", s)}
          onSelectDistrict={(s, d) => open("district", `${s}|${d}`)}
        />
      </Panel>

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="State-wise blocking posture" subtitle="Click a bar to segregate that state" />
          <StackedBars
            data={stateRows}
            xKey="state"
            onSelect={(row) => row?.state && apply("state", row.state, row.state)}
            keys={[
              { key: "blocked", label: "Blocked", color: "var(--chart-4)" },
              { key: "notBlocked", label: "Not blocked", color: "var(--chart-3)" },
            ]}
          />
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHeader title="Suspect volume share" subtitle="Click a tile to open the state dossier" />
          <Treemap
            items={stateRows.map((s) => ({ name: s.state, value: s.totalSuspectNumbers }))}
            onSelect={(name) => open("state", name)}
          />
        </Panel>
      </div>

      <ComplaintRecordsPanel
        title="Complaint feed for the current segregation"
        subtitle="Acknowledgement, victim, suspect, bank and money-trail intelligence"
      />

      <HierarchyExplorer initialState={state} />
    </>
  );
}
