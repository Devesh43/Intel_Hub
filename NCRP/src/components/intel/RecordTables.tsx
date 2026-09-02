import { useMemo } from "react";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { DataTable, type Column } from "@/components/intel/DataTable";
import { StatusChip } from "@/components/intel/StatusChip";
import { EntityLink, useEntityDrawer } from "@/components/intel/EntityLinks";
import { useApplyFilter, useIntelFilters } from "@/lib/filter-context";
import {
  complaintRecords,
  filterComplaints,
  filterMobiles,
  imeiRecords,
  mobileByNumber,
  mobileRecords,
  posRecords,
  type ComplaintRecord,
  type ImeiRecord,
  type MobileRecord,
  type PosRecord,
} from "@/lib/intel";
import { formatLac, formatNumber } from "@/lib/telecom";

/** Chip that both shows a status and segregates the dataset when clicked. */
export function FilterChip({
  filterKey,
  value,
  tone,
  children,
}: {
  filterKey: string;
  value: string;
  tone?: React.ComponentProps<typeof StatusChip>["tone"];
  children?: React.ReactNode;
}) {
  const apply = useApplyFilter();
  const { filters } = useIntelFilters();
  const active = (filters[filterKey] ?? []).includes(value);
  return (
    <StatusChip
      tone={tone}
      className={active ? "ring-1 ring-primary/60" : undefined}
      onClick={() => apply(filterKey, value)}
      title={`Filter by ${value}`}
    >
      {children ?? value}
    </StatusChip>
  );
}

/* ------------------------------- mobiles ---------------------------------- */

export function useFilteredMobiles(extra?: (m: MobileRecord) => boolean) {
  const { filters, range } = useIntelFilters();
  return useMemo(() => {
    const base = filterMobiles(mobileRecords, filters, range);
    return extra ? base.filter(extra) : base;
  }, [filters, range, extra]);
}

export function MobileRecordsPanel({
  title = "Suspect number registry",
  subtitle = "Every identifier, status badge and amount is clickable",
  rows,
  pageSize = 8,
}: {
  title?: string;
  subtitle?: string;
  rows: MobileRecord[];
  pageSize?: number;
}) {
  const { open } = useEntityDrawer();
  const columns: Column<MobileRecord>[] = [
    {
      key: "mobileNumber",
      header: "Mobile no.",
      value: (r) => r.mobileNumber,
      render: (r) => <EntityLink type="mobile" id={r.mobileNumber} mono />,
    },
    {
      key: "state",
      header: "State / LSA",
      value: (r) => r.state,
      render: (r) => <EntityLink type="state" id={r.state} />,
    },
    {
      key: "district",
      header: "District",
      value: (r) => r.district,
      render: (r) => <EntityLink type="district" id={`${r.state}|${r.district}`}>{r.district}</EntityLink>,
    },
    {
      key: "policeStation",
      header: "Police station",
      value: (r) => r.policeStation,
      render: (r) => (
        <EntityLink type="ps" id={`${r.state}|${r.district}|${r.policeStation}`}>{r.policeStation}</EntityLink>
      ),
    },
    {
      key: "operator",
      header: "Operator",
      value: (r) => r.operator,
      render: (r) => <EntityLink type="operator" id={r.operator} />,
    },
    { key: "ncrpComplaints", header: "NCRP", value: (r) => r.ncrpComplaints, align: "right" },
    {
      key: "totalAmountInvolvedLac",
      header: "Amount",
      value: (r) => r.totalAmountInvolvedLac,
      align: "right",
      render: (r) => (
        <EntityLink type="mobile" id={r.mobileNumber} mono>{formatLac(r.totalAmountInvolvedLac)}</EntityLink>
      ),
    },
    {
      key: "posCode",
      header: "PoS",
      value: (r) => r.posCode,
      render: (r) => <EntityLink type="pos" id={r.posCode} mono />,
    },
    {
      key: "linkedImei",
      header: "IMEI",
      value: (r) => r.linkedImei,
      align: "right",
      render: (r) =>
        r.imeis[0] ? <EntityLink type="imei" id={r.imeis[0].imeiNumber} mono>{r.linkedImei}</EntityLink> : <span className="num">0</span>,
    },
    {
      key: "blockingStatus",
      header: "Blocking",
      value: (r) => r.blockingStatus,
      render: (r) => (
        <FilterChip filterKey="blockingStatus" value={r.blockingStatus} tone={r.blockingStatus === "Blocked" ? "success" : "danger"} />
      ),
    },
    {
      key: "internationalRoaming",
      header: "Intl. roaming",
      value: (r) => r.internationalRoaming,
      render: (r) => <FilterChip filterKey="internationalRoaming" value={r.internationalRoaming} />,
    },
    {
      key: "samanvayaProfile",
      header: "Samanvaya",
      value: (r) => r.samanvayaProfile,
      render: (r) => <FilterChip filterKey="samanvayaProfile" value={r.samanvayaProfile} />,
    },
    {
      key: "plottedOnPratibimb",
      header: "Pratibimb",
      value: (r) => r.plottedOnPratibimb,
      render: (r) => <FilterChip filterKey="plottedOnPratibimb" value={r.plottedOnPratibimb} />,
    },
    {
      key: "dotFlag",
      header: "DoT flag",
      value: (r) => r.dotFlag,
      render: (r) => <FilterChip filterKey="dotFlag" value={r.dotFlag} />,
    },
    {
      key: "ceirStatus",
      header: "CEIR",
      value: (r) => r.ceirStatus,
      render: (r) => <FilterChip filterKey="ceirStatus" value={r.ceirStatus} />,
    },
    {
      key: "dotStatus",
      header: "DoT status",
      value: (r) => r.dotStatus,
      render: (r) => <FilterChip filterKey="dotStatus" value={r.dotStatus} />,
    },
    {
      key: "syncStatus",
      header: "Sync",
      value: (r) => r.syncStatus,
      render: (r) => <FilterChip filterKey="syncStatus" value={r.syncStatus} />,
    },
    {
      key: "riskLevel",
      header: "Risk",
      value: (r) => r.riskLevel,
      render: (r) => (
        <FilterChip
          filterKey="riskLevel"
          value={r.riskLevel}
          tone={r.riskLevel === "High Risk" ? "danger" : r.riskLevel === "Medium Risk" ? "warning" : "success"}
        />
      ),
    },
    {
      key: "investigationStatus",
      header: "Investigation",
      value: (r) => r.investigationStatus,
      render: (r) => <FilterChip filterKey="investigationStatus" value={r.investigationStatus} />,
    },
    {
      key: "victimName",
      header: "Victim",
      value: (r) => r.victimName,
      render: (r) => <EntityLink type="victim" id={r.victimName} />,
    },
    {
      key: "suspectName",
      header: "Suspect",
      value: (r) => r.suspectName,
      render: (r) => <EntityLink type="suspect" id={r.suspectName} />,
    },
    { key: "deviceBrand", header: "Device", value: (r) => `${r.deviceBrand} ${r.deviceModel}` },
    { key: "bank", header: "Bank", value: (r) => r.bank },
    { key: "wallet", header: "Wallet", value: (r) => r.wallet },
    { key: "accountType", header: "Account type", value: (r) => r.accountType },
    { key: "simSupplyChain", header: "SIM supply chain", value: (r) => r.simSupplyChain },
    { key: "sdr", header: "SDR", value: (r) => r.sdr },
    { key: "blockingDate", header: "Blocked on", value: (r) => r.blockingDate },
    { key: "lastUpdated", header: "Last updated", value: (r) => r.lastUpdated },
  ];

  return (
    <Panel className="mb-6 overflow-hidden">
      <PanelHeader
        title={title}
        subtitle={subtitle}
        actions={<StatusChip tone="info">{formatNumber(rows.length)} records</StatusChip>}
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search numbers, victims, suspects, PoS…"
        exportName="suspect-number-registry"
        pageSize={pageSize}
        emptyLabel="No suspect numbers match the current segregation."
        onRowClick={(r) => open("mobile", r.mobileNumber)}
      />
    </Panel>
  );
}

/* ------------------------------ complaints -------------------------------- */

export function ComplaintRecordsPanel({
  title = "Complaint corpus",
  subtitle = "NCRP acknowledgements linked to suspect telecom identifiers",
  rows,
  pageSize = 8,
}: {
  title?: string;
  subtitle?: string;
  rows?: ComplaintRecord[];
  pageSize?: number;
}) {
  const { filters, range } = useIntelFilters();
  const { open } = useEntityDrawer();
  const data = useMemo(
    () => rows ?? filterComplaints(complaintRecords, filters, range),
    [rows, filters, range],
  );

  const columns: Column<ComplaintRecord>[] = [
    {
      key: "ackNumber",
      header: "Ack number",
      value: (r) => r.ackNumber,
      render: (r) => <EntityLink type="complaint" id={r.ackNumber} mono />,
    },
    {
      key: "mobileNumber",
      header: "Mobile no.",
      value: (r) => r.mobileNumber,
      render: (r) => <EntityLink type="mobile" id={r.mobileNumber} mono />,
    },
    {
      key: "imeiNumber",
      header: "IMEI",
      value: (r) => r.imeiNumber,
      render: (r) => <EntityLink type="imei" id={r.imeiNumber} mono />,
    },
    {
      key: "state",
      header: "State / LSA",
      value: (r) => r.state,
      render: (r) => <EntityLink type="state" id={r.state} />,
    },
    {
      key: "district",
      header: "District",
      value: (r) => r.district,
      render: (r) => <EntityLink type="district" id={`${r.state}|${r.district}`}>{r.district}</EntityLink>,
    },
    {
      key: "policeStation",
      header: "Police station",
      value: (r) => r.policeStation,
      render: (r) => (
        <EntityLink type="ps" id={`${r.state}|${r.district}|${r.policeStation}`}>{r.policeStation}</EntityLink>
      ),
    },
    { key: "dateReported", header: "Reported", value: (r) => r.dateReported },
    { key: "incidentDate", header: "Incident", value: (r) => r.incidentDate },
    {
      key: "amountInvolved",
      header: "Amount",
      value: (r) => r.amountInvolved,
      align: "right",
      render: (r) => <EntityLink type="complaint" id={r.ackNumber} mono>{formatLac(r.amountInvolved)}</EntityLink>,
    },
    {
      key: "status",
      header: "Status",
      value: (r) => r.status,
      render: (r) => <FilterChip filterKey="status" value={r.status} />,
    },
    {
      key: "category",
      header: "Category",
      value: (r) => r.category,
      render: (r) => <FilterChip filterKey="category" value={r.category} />,
    },
    {
      key: "subcategory",
      header: "Subcategory",
      value: (r) => r.subcategory,
      render: (r) => <FilterChip filterKey="subcategory" value={r.subcategory} />,
    },
    {
      key: "fraudType",
      header: "Fraud type",
      value: (r) => r.fraudType,
      render: (r) => <FilterChip filterKey="fraudType" value={r.fraudType} />,
    },
    {
      key: "firStatus",
      header: "FIR",
      value: (r) => r.firStatus,
      render: (r) => <FilterChip filterKey="firStatus" value={r.firStatus} />,
    },
    {
      key: "chargesheetStatus",
      header: "Chargesheet",
      value: (r) => r.chargesheetStatus,
      render: (r) => <FilterChip filterKey="chargesheetStatus" value={r.chargesheetStatus} />,
    },
    {
      key: "investigationStatus",
      header: "Investigation",
      value: (r) => r.investigationStatus,
      render: (r) => <FilterChip filterKey="investigationStatus" value={r.investigationStatus} />,
    },
    {
      key: "riskLevel",
      header: "Risk",
      value: (r) => r.riskLevel,
      render: (r) => (
        <FilterChip
          filterKey="riskLevel"
          value={r.riskLevel}
          tone={r.riskLevel === "High Risk" ? "danger" : r.riskLevel === "Medium Risk" ? "warning" : "success"}
        />
      ),
    },
    {
      key: "victimName",
      header: "Victim",
      value: (r) => r.victimName,
      render: (r) => <EntityLink type="victim" id={r.victimName} />,
    },
    {
      key: "suspectName",
      header: "Suspect",
      value: (r) => r.suspectName,
      render: (r) => <EntityLink type="suspect" id={r.suspectName} />,
    },
    { key: "victimGender", header: "Gender", value: (r) => r.victimGender },
    { key: "victimAgeGroup", header: "Age group", value: (r) => r.victimAgeGroup },
    { key: "bank", header: "Bank", value: (r) => r.bank },
    { key: "wallet", header: "Wallet", value: (r) => r.wallet },
    { key: "accountType", header: "Account", value: (r) => r.accountType },
    {
      key: "operator",
      header: "Operator",
      value: (r) => r.operator,
      render: (r) => <EntityLink type="operator" id={r.operator} />,
    },
    { key: "lastUpdated", header: "Last updated", value: (r) => r.lastUpdated },
  ];

  return (
    <Panel className="mb-6 overflow-hidden">
      <PanelHeader
        title={title}
        subtitle={subtitle}
        actions={<StatusChip tone="info">{formatNumber(data.length)} complaints</StatusChip>}
      />
      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Search acknowledgements, victims, banks…"
        exportName="complaint-corpus"
        pageSize={pageSize}
        emptyLabel="No complaints match the current segregation."
        onRowClick={(r) => open("complaint", r.ackNumber)}
      />
    </Panel>
  );
}

/* --------------------------------- IMEI ----------------------------------- */

export function ImeiRecordsPanel({
  title = "Handset registry",
  subtitle = "IMEI records derived from the same suspect number corpus",
  rows,
  pageSize = 8,
}: {
  title?: string;
  subtitle?: string;
  rows?: ImeiRecord[];
  pageSize?: number;
}) {
  const { filters, range } = useIntelFilters();
  const { open } = useEntityDrawer();
  const data = useMemo(() => {
    if (rows) return rows;
    const allowed = new Set(filterMobiles(mobileRecords, filters, range).map((m) => m.mobileNumber));
    return imeiRecords.filter((i) => allowed.has(i.mobileNumber));
  }, [rows, filters, range]);

  const columns: Column<ImeiRecord>[] = [
    {
      key: "imeiNumber",
      header: "IMEI",
      value: (r) => r.imeiNumber,
      render: (r) => <EntityLink type="imei" id={r.imeiNumber} mono />,
    },
    {
      key: "mobileNumber",
      header: "Linked mobile",
      value: (r) => r.mobileNumber,
      render: (r) => <EntityLink type="mobile" id={r.mobileNumber} mono />,
    },
    {
      key: "state",
      header: "State / LSA",
      value: (r) => r.state,
      render: (r) => <EntityLink type="state" id={r.state} />,
    },
    {
      key: "district",
      header: "District",
      value: (r) => r.district,
      render: (r) => <EntityLink type="district" id={`${r.state}|${r.district}`}>{r.district}</EntityLink>,
    },
    {
      key: "policeStation",
      header: "Police station",
      value: (r) => r.policeStation,
      render: (r) => (
        <EntityLink type="ps" id={`${r.state}|${r.district}|${r.policeStation}`}>{r.policeStation}</EntityLink>
      ),
    },
    {
      key: "operator",
      header: "Operator",
      value: (r) => r.operator,
      render: (r) => <EntityLink type="operator" id={r.operator} />,
    },
    { key: "dateOfSimInsert", header: "SIM insert", value: (r) => r.dateOfSimInsert },
    {
      key: "imeiBlockingStatus",
      header: "Blocking",
      value: (r) => r.imeiBlockingStatus,
      render: (r) => (
        <FilterChip
          filterKey="blockingStatus"
          value={r.imeiBlockingStatus}
          tone={r.imeiBlockingStatus === "Blocked" ? "success" : "danger"}
        />
      ),
    },
    {
      key: "imeiInternationalRoaming",
      header: "Intl. roaming",
      value: (r) => r.imeiInternationalRoaming,
      render: (r) => <FilterChip filterKey="internationalRoaming" value={r.imeiInternationalRoaming} />,
    },
    {
      key: "plottedOnPratibimb",
      header: "Pratibimb",
      value: (r) => r.plottedOnPratibimb,
      render: (r) => <FilterChip filterKey="plottedOnPratibimb" value={r.plottedOnPratibimb} />,
    },
    {
      key: "ceirStatus",
      header: "CEIR",
      value: (r) => r.ceirStatus,
      render: (r) => <FilterChip filterKey="ceirStatus" value={r.ceirStatus} />,
    },
    {
      key: "dotStatus",
      header: "DoT status",
      value: (r) => r.dotStatus,
      render: (r) => <FilterChip filterKey="dotStatus" value={r.dotStatus} />,
    },
    {
      key: "deviceBrand",
      header: "Brand",
      value: (r) => r.deviceBrand,
      render: (r) => <FilterChip filterKey="deviceBrand" value={r.deviceBrand} />,
    },
    { key: "deviceModel", header: "Model", value: (r) => r.deviceModel },
    {
      key: "amount",
      header: "Case amount",
      value: (r) => mobileByNumber.get(r.mobileNumber)?.totalAmountInvolvedLac ?? 0,
      align: "right",
      render: (r) => (
        <span className="num">{formatLac(mobileByNumber.get(r.mobileNumber)?.totalAmountInvolvedLac ?? 0)}</span>
      ),
    },
  ];

  return (
    <Panel className="mb-6 overflow-hidden">
      <PanelHeader
        title={title}
        subtitle={subtitle}
        actions={<StatusChip tone="info">{formatNumber(data.length)} handsets</StatusChip>}
      />
      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Search IMEI, handset brand, jurisdiction…"
        exportName="imei-registry"
        pageSize={pageSize}
        emptyLabel="No handsets match the current segregation."
        onRowClick={(r) => open("imei", r.imeiNumber)}
      />
    </Panel>
  );
}

/* ---------------------------------- PoS ----------------------------------- */

export function PosRecordsPanel({
  title = "Point of sale repository",
  subtitle = "SIM supply-chain outlets linked to suspect numbers",
  rows,
  pageSize = 8,
}: {
  title?: string;
  subtitle?: string;
  rows?: PosRecord[];
  pageSize?: number;
}) {
  const { filters, range } = useIntelFilters();
  const { open } = useEntityDrawer();
  const data = useMemo(() => {
    if (rows) return rows;
    const allowed = new Set(filterMobiles(mobileRecords, filters, range).map((m) => m.posCode));
    return posRecords.filter((p) => allowed.has(p.posCode));
  }, [rows, filters, range]);

  const columns: Column<PosRecord>[] = [
    {
      key: "posCode",
      header: "PoS code",
      value: (r) => r.posCode,
      render: (r) => <EntityLink type="pos" id={r.posCode} mono />,
    },
    { key: "posName", header: "PoS name", value: (r) => r.posName },
    { key: "posAgentCode", header: "Agent code", value: (r) => r.posAgentCode },
    { key: "posAgentName", header: "Agent", value: (r) => r.posAgentName },
    { key: "posAddress", header: "Address", value: (r) => r.posAddress },
    {
      key: "district",
      header: "District",
      value: (r) => r.district,
      render: (r) => <EntityLink type="district" id={`${r.state}|${r.district}`}>{r.district}</EntityLink>,
    },
    {
      key: "lsa",
      header: "LSA",
      value: (r) => r.lsa,
      render: (r) => <EntityLink type="state" id={r.lsa} />,
    },
    {
      key: "tsp",
      header: "TSP",
      value: (r) => r.tsp,
      render: (r) => <EntityLink type="operator" id={r.tsp} />,
    },
    { key: "circle", header: "Circle", value: (r) => r.circle },
    { key: "latitude", header: "Latitude", value: (r) => r.latitude, align: "right" },
    { key: "longitude", header: "Longitude", value: (r) => r.longitude, align: "right" },
    {
      key: "totalSimsIssued",
      header: "SIMs issued",
      value: (r) => r.totalSimsIssued,
      align: "right",
      render: (r) => <span className="num">{formatNumber(r.totalSimsIssued)}</span>,
    },
    {
      key: "simsAlreadyDisconnected",
      header: "Disconnected",
      value: (r) => r.simsAlreadyDisconnected,
      align: "right",
      render: (r) => <span className="num text-emerald">{formatNumber(r.simsAlreadyDisconnected)}</span>,
    },
    {
      key: "suspectedSims",
      header: "Suspected",
      value: (r) => r.suspectedSims,
      align: "right",
      render: (r) => <span className="num text-destructive">{formatNumber(r.suspectedSims)}</span>,
    },
    {
      key: "statusOfPos",
      header: "Status",
      value: (r) => r.statusOfPos,
      render: (r) => <FilterChip filterKey="statusOfPos" value={r.statusOfPos} />,
    },
    { key: "dateOfAction", header: "Date of action", value: (r) => r.dateOfAction },
    { key: "action", header: "Action", value: (r) => r.action },
    {
      key: "riskLevel",
      header: "Risk",
      value: (r) => r.riskLevel,
      render: (r) => (
        <FilterChip
          filterKey="riskLevel"
          value={r.riskLevel}
          tone={r.riskLevel === "High Risk" ? "danger" : r.riskLevel === "Medium Risk" ? "warning" : "success"}
        />
      ),
    },
    {
      key: "linkedNumbers",
      header: "Linked numbers",
      value: (r) => r.linkedNumbers.length,
      align: "right",
      render: (r) => <EntityLink type="pos" id={r.posCode} mono>{r.linkedNumbers.length}</EntityLink>,
    },
  ];

  return (
    <Panel className="mb-6 overflow-hidden">
      <PanelHeader
        title={title}
        subtitle={subtitle}
        actions={<StatusChip tone="info">{formatNumber(data.length)} outlets</StatusChip>}
      />
      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Search PoS code, agent, address…"
        exportName="pos-repository"
        pageSize={pageSize}
        emptyLabel="No points of sale match the current segregation."
        onRowClick={(r) => open("pos", r.posCode)}
      />
    </Panel>
  );
}
