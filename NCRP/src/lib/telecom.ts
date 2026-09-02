import districtWiseMobile from "@/data/districtWiseMobile.json";
import imeiSummary from "@/data/imeiSummary.json";
import mobileNumberDetails from "@/data/mobileNumberDetails.json";
import mobileNumberSummary from "@/data/mobileNumberSummary.json";
import posSummary from "@/data/posSummary.json";
import psWiseMobile from "@/data/psWiseMobile.json";
import stateWiseMobile from "@/data/stateWiseMobile.json";

/* ---------------------------------- types --------------------------------- */

export interface Bucket {
  label: string;
  blocked: number;
  notBlocked: number;
  plottedOnPratibimb: number;
}

export interface SummaryTile {
  key: string;
  title: string;
  value: number;
  unique?: number;
  isFigureOnly?: boolean;
  buckets?: Bucket[];
}

export interface StateRow {
  state: string;
  totalSuspectNumbers: number;
  blocked: number;
  notBlocked: number;
  plottedOnPratibimb: number;
}

export interface DistrictRow {
  district: string;
  totalSuspectNumbers: number;
  blocked: number;
  notBlocked: number;
  plottedOnPratibimb: number;
}

export interface PsMobileRow {
  mobileNumber: string;
  ncrpComplaints: number;
  associatedSuspectNumbers: number;
  totalAmountInvolvedLac: number;
  posCode: string;
  linkedImei: number;
  blockingStatus: string;
  internationalRoaming: string;
  samanvayaProfile: string;
  plottedOnPratibimb: string;
  dotFlag: string;
  simSupplyChain: string;
  sdr: string;
}

export interface ComplaintRow {
  ackNumber: string;
  state: string;
  district: string;
  policeStation: string;
  dateReported: string;
  amountInvolved: number;
  status: string;
}

export interface PosRow {
  posCode: string;
  posName: string;
  posAgentCode: string;
  posAgentName: string;
  posAddress: string;
  district: string;
  lsa: string;
  tsp: string;
  latitude: number;
  longitude: number;
  totalSimsIssued: number;
  simsAlreadyDisconnected: number;
  suspectedSims: number;
  statusOfPos: string;
  dateOfAction: string;
  action: string;
}

export interface ImeiRow {
  imeiNumber: string;
  mobileNumber: string;
  dateOfSimInsert: string;
  imeiBlockingStatus: string;
  imeiInternationalRoaming: string;
  plottedOnPratibimb: string;
}

export interface BlockingRow {
  mobileNumber: string;
  tspLsa: string;
  dateTimeOfReportingOnNcrp: string;
  dateTimeOfRequestSentForBlocking: string;
  dateTimeOfRequestSentToTsp: string;
  actualDateTimeOfBlocking: string;
  timeTakenByState: string;
  timeTakenByTsp: string;
  totalTimeTaken: string;
}

export interface PratibimbProfile {
  mobileNo: string;
  imei: string;
  coordinates: string;
  address: string;
  locationFetchTime: string;
  totalComplaints: number;
  ncrpComplaint: string;
}

/* ---------------------------------- data ---------------------------------- */

export const mobileTiles = mobileNumberSummary.tiles as SummaryTile[];
export const imeiTiles = imeiSummary.tiles as SummaryTile[];
export const posTiles = posSummary.tiles as SummaryTile[];
export const stateRows = stateWiseMobile.rows as StateRow[];
export const districtsByState = districtWiseMobile as Record<string, DistrictRow[]>;
export const psRowsByDistrict = psWiseMobile as Record<string, PsMobileRow[]>;
export const details = mobileNumberDetails as {
  complaints: Record<string, ComplaintRow[]>;
  posDetails: Record<string, PosRow[]>;
  imeiDetails: Record<string, ImeiRow[]>;
  blockingTimeline: Record<string, BlockingRow[]>;
  pratibimb: Record<string, PratibimbProfile>;
};

export const TSPS = ["Airtel", "Jio", "VI", "BSNL"] as const;

/* -------------------------------- selectors -------------------------------- */

export const getDistricts = (state: string): DistrictRow[] => districtsByState[state] ?? [];

export const getPsRows = (district: string): PsMobileRow[] =>
  psRowsByDistrict[district] ?? psRowsByDistrict.default ?? [];

export const getComplaints = (mobile: string): ComplaintRow[] =>
  details.complaints[mobile] ?? details.complaints["1234567890"] ?? [];

export const getPos = (posCode: string): PosRow | undefined =>
  details.posDetails[posCode]?.[0] ?? details.posDetails["1234"]?.[0];

export const getImeis = (mobile: string): ImeiRow[] =>
  (details.imeiDetails[mobile] ?? details.imeiDetails["1234567890"] ?? []).map((r) => ({
    ...r,
    mobileNumber: mobile,
  }));

export const getBlocking = (mobile: string): BlockingRow | undefined => {
  const row = details.blockingTimeline[mobile]?.[0] ?? details.blockingTimeline["1234567890"]?.[0];
  return row ? { ...row, mobileNumber: mobile } : undefined;
};

export const getPratibimb = (mobile: string): PratibimbProfile | undefined =>
  details.pratibimb[mobile] ?? details.pratibimb["1234567890"];

/** Police stations are derived from the complaint corpus for a district. */
export const getPoliceStations = (state: string, district: string) => {
  const rows = getPsRows(district);
  const names = new Set<string>();
  Object.values(details.complaints)
    .flat()
    .filter((c) => c.district === district)
    .forEach((c) => names.add(c.policeStation));
  if (names.size === 0) names.add(`${district} City PS`);
  if (rows.length > 1) names.add(`${district} Cyber PS`);
  return Array.from(names).map((name, i) => {
    const share = rows.length ? rows.length : 1;
    const bucket = getDistricts(state).find((d) => d.district === district);
    const total = bucket ? Math.round(bucket.totalSuspectNumbers / (names.size || 1)) : 0;
    return {
      policeStation: name,
      totalSuspectNumbers: total,
      blocked: Math.round(total * 0.68),
      notBlocked: total - Math.round(total * 0.68),
      plottedOnPratibimb: Math.round(total * 0.5),
      numbers: share,
      index: i,
    };
  });
};

/* -------------------------------- utilities -------------------------------- */

export const nf = new Intl.NumberFormat("en-IN");
export const formatNumber = (n: number) => nf.format(n);
export const formatLac = (n: number) => `₹${n.toFixed(2)} L`;

/** Deterministic pseudo-random in [0,1) from a string seed. */
export function seeded(seed: string, i = 0) {
  let h = 2166136261 ^ i;
  for (let k = 0; k < seed.length; k++) {
    h ^= seed.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Deterministic 12-point trend series derived from a value + seed. */
export function trendSeries(seed: string, value: number, points = 12) {
  const out: { t: string; v: number }[] = [];
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  let acc = value * 0.55;
  for (let i = 0; i < points; i++) {
    const drift = 0.03 + seeded(seed, i) * 0.09;
    acc = acc * (1 + drift);
    out.push({
      t: months[(months.length - points + i + months.length) % months.length],
      v: Math.round(Math.min(acc, value * (0.6 + (i / points) * 0.4))),
    });
  }
  out[out.length - 1].v = value;
  return out;
}

export function trendDelta(series: { v: number }[]) {
  if (series.length < 2) return 0;
  const prev = series[series.length - 2].v || 1;
  return ((series[series.length - 1].v - prev) / prev) * 100;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]) {
  if (!rows.length) return "";
  const cols = columns ?? Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]) {
  const blob = new Blob([toCsv(rows, columns)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------- derived operational data ----------------------- */

const STATUS_POOL = [
  "Under Investigation",
  "Evidence Collection",
  "FIR Registered",
  "Chargesheet Filed",
  "Closed",
];

export interface FeedComplaint extends ComplaintRow {
  mobileNumber: string;
}

/** Complaint corpus expanded across the state/district hierarchy. */
export const complaintCorpus: FeedComplaint[] = (() => {
  const out: FeedComplaint[] = [];
  const base = Object.entries(details.complaints).flatMap(([mobile, rows]) =>
    rows.map((r) => ({ ...r, mobileNumber: mobile })),
  );
  out.push(...base);
  stateRows.forEach((s) => {
    const districts = getDistricts(s.state);
    const list = districts.length ? districts : [{ district: s.state, totalSuspectNumbers: 0 } as DistrictRow];
    list.forEach((d, di) => {
      const rows = getPsRows(d.district);
      rows.forEach((row, ri) => {
        const n = 1 + Math.floor(seeded(s.state + d.district + row.mobileNumber, ri) * 3);
        for (let k = 0; k < n; k++) {
          const r = seeded(`${s.state}${d.district}${row.mobileNumber}${k}`, k + 7);
          out.push({
            ackNumber: `2140526${String(Math.floor(r * 8999999) + 1000000)}`,
            state: s.state,
            district: d.district,
            policeStation: `${d.district} ${k % 2 === 0 ? "City" : "Cyber"} PS`,
            dateReported: `${String(1 + Math.floor(r * 27)).padStart(2, "0")}/05/2026`,
            amountInvolved: Math.round(r * 900) / 100 + 0.2,
            status: STATUS_POOL[Math.floor(r * STATUS_POOL.length)],
            mobileNumber: row.mobileNumber,
          });
        }
      });
    });
  });
  return out;
})();

export const allPsMobileRows: (PsMobileRow & { state: string; district: string })[] = (() => {
  const out: (PsMobileRow & { state: string; district: string })[] = [];
  stateRows.forEach((s) =>
    getDistricts(s.state).forEach((d) =>
      getPsRows(d.district).forEach((row) =>
        out.push({ ...row, state: s.state, district: d.district }),
      ),
    ),
  );
  // de-duplicate by state+district+number
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.state}|${r.district}|${r.mobileNumber}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();

export const monthlySeries = (seed: string, base: number) =>
  trendSeries(seed, base).map((p, i) => ({
    month: p.t,
    reported: p.v,
    blocked: Math.round(p.v * (0.6 + seeded(seed, i) * 0.15)),
    plotted: Math.round(p.v * (0.45 + seeded(seed, i + 3) * 0.12)),
  }));
