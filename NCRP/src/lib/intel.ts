import { CIRCULARS, OFFICERS } from "./directory";
import {
  allPsMobileRows,
  complaintCorpus,
  details,
  getDistricts,
  seeded,
  stateRows,
  TSPS,
  type ComplaintRow,
  type PosRow,
  type PsMobileRow,
} from "./telecom";

/* --------------------------------- pools ---------------------------------- */

const pick = <T,>(pool: readonly T[], seed: string, i = 0) => pool[Math.floor(seeded(seed, i) * pool.length) % pool.length];

export const CATEGORIES = ["Financial Fraud", "Online Impersonation", "Cyber Extortion", "Social Media Crime"] as const;
export const SUBCATEGORIES = [
  "UPI Fraud",
  "Investment Scam",
  "Digital Arrest",
  "Job Fraud",
  "OTP Compromise",
  "Loan App Harassment",
] as const;
export const FRAUD_TYPES = ["Phishing", "Vishing", "SIM Swap", "Mule Account", "Fake KYC", "Courier Scam"] as const;
export const FIR_STATUSES = ["FIR Registered", "FIR Pending", "Not Applicable"] as const;
export const CHARGESHEET_STATUSES = ["Chargesheet Filed", "Chargesheet Pending", "Not Reached"] as const;
export const INVESTIGATION_STATUSES = ["Open", "Active", "Escalated", "Closed"] as const;
export const RISKS = ["High Risk", "Medium Risk", "Low Risk"] as const;
export const CEIR_STATUSES = ["CEIR Barred", "CEIR Pending", "CEIR Cleared"] as const;
export const DOT_STATUSES = ["DoT Verified", "DoT In Review", "DoT Not Sent"] as const;
export const SYNC_STATUSES = ["Synced", "Sync Delayed", "Sync Failed"] as const;
export const DEVICE_BRANDS = ["Samsung", "Xiaomi", "Realme", "Vivo", "Oppo", "Apple", "Tecno"] as const;
export const DEVICE_MODELS: Record<string, string[]> = {
  Samsung: ["Galaxy M14", "Galaxy A05", "Galaxy F23"],
  Xiaomi: ["Redmi 12C", "Redmi Note 13", "Poco M6"],
  Realme: ["Narzo 60", "C55", "11x 5G"],
  Vivo: ["Y28", "T2x", "Y17s"],
  Oppo: ["A18", "A78", "K11x"],
  Apple: ["iPhone 11", "iPhone SE", "iPhone 13"],
  Tecno: ["Spark 10", "Pova 5", "Pop 8"],
};
export const GENDERS = ["Male", "Female", "Other"] as const;
export const AGE_GROUPS = ["18-25", "26-35", "36-50", "51-65", "65+"] as const;
export const BANKS = ["SBI", "HDFC Bank", "ICICI Bank", "Punjab National Bank", "Axis Bank", "Bank of Baroda"] as const;
export const WALLETS = ["Paytm", "PhonePe", "Google Pay", "Amazon Pay", "Mobikwik"] as const;
export const ACCOUNT_TYPES = ["Savings", "Current", "Wallet", "Prepaid Card"] as const;
export const CIRCLES = ["North", "South", "East", "West", "Central"] as const;

const FIRST = ["Arun", "Kavita", "Rakesh", "Meera", "Sandeep", "Nisha", "Vikram", "Anjali", "Rohit", "Sneha", "Imran", "Pooja"];
const LAST = ["Sharma", "Iyer", "Khan", "Das", "Gupta", "Reddy", "Mehta", "Bose", "Nair", "Chauhan", "Verma", "Yadav"];
const person = (seed: string, i = 0) => `${pick(FIRST, seed, i)} ${pick(LAST, seed, i + 4)}`;

const riskFromAmount = (amount: number, seed: string) =>
  amount >= 6 ? "High Risk" : amount >= 3 ? "Medium Risk" : seeded(seed, 9) > 0.8 ? "Medium Risk" : "Low Risk";

const dateIn = (seed: string, i: number, month = "05") =>
  `${String(1 + Math.floor(seeded(seed, i) * 27)).padStart(2, "0")}/${month}/2026`;

/* -------------------------------- records ---------------------------------- */

export interface ImeiRecord {
  imeiNumber: string;
  mobileNumber: string;
  state: string;
  district: string;
  policeStation: string;
  operator: string;
  dateOfSimInsert: string;
  imeiBlockingStatus: string;
  imeiInternationalRoaming: string;
  plottedOnPratibimb: string;
  deviceBrand: string;
  deviceModel: string;
  ceirStatus: string;
  dotStatus: string;
}

export interface ComplaintRecord extends ComplaintRow {
  mobileNumber: string;
  category: string;
  subcategory: string;
  fraudType: string;
  firStatus: string;
  chargesheetStatus: string;
  investigationStatus: string;
  incidentDate: string;
  lastUpdated: string;
  riskLevel: string;
  victimName: string;
  victimGender: string;
  victimAgeGroup: string;
  suspectName: string;
  bank: string;
  wallet: string;
  accountType: string;
  operator: string;
  imeiNumber: string;
}

export interface MobileRecord extends PsMobileRow {
  state: string;
  district: string;
  policeStation: string;
  operator: string;
  lsa: string;
  circle: string;
  riskLevel: string;
  deviceBrand: string;
  deviceModel: string;
  ceirStatus: string;
  dotStatus: string;
  syncStatus: string;
  blockingDate: string;
  lastUpdated: string;
  victimName: string;
  victimGender: string;
  victimAgeGroup: string;
  suspectName: string;
  bank: string;
  wallet: string;
  accountType: string;
  category: string;
  subcategory: string;
  fraudType: string;
  firStatus: string;
  chargesheetStatus: string;
  investigationStatus: string;
  imeis: ImeiRecord[];
}

export interface PosRecord extends PosRow {
  state: string;
  circle: string;
  riskLevel: string;
  linkedNumbers: string[];
}

/* ------------------------------ construction ------------------------------- */

const complaintsByMobile = new Map<string, ComplaintRow[]>();
complaintCorpus.forEach((c) => {
  const list = complaintsByMobile.get(c.mobileNumber) ?? [];
  list.push(c);
  complaintsByMobile.set(c.mobileNumber, list);
});

const psForRow = (district: string, i: number) => `${district} ${i % 2 === 0 ? "City" : "Cyber"} PS`;

export const mobileRecords: MobileRecord[] = allPsMobileRows.map((row, idx) => {
  const seed = `${row.state}|${row.district}|${row.mobileNumber}`;
  const brand = pick(DEVICE_BRANDS, seed, 1);
  const amount = row.totalAmountInvolvedLac;
  const base: Omit<MobileRecord, "imeis"> = {
    ...row,
    policeStation: psForRow(row.district, idx),
    operator: pick(TSPS, seed, 2),
    lsa: row.state,
    circle: pick(CIRCLES, seed, 3),
    riskLevel: riskFromAmount(amount, seed),
    deviceBrand: brand,
    deviceModel: pick(DEVICE_MODELS[brand], seed, 4),
    ceirStatus: row.blockingStatus === "Blocked" ? "CEIR Barred" : pick(CEIR_STATUSES.slice(1), seed, 5),
    dotStatus: row.dotFlag === "Yes" ? "DoT Verified" : pick(DOT_STATUSES.slice(1), seed, 6),
    syncStatus: pick(SYNC_STATUSES, seed, 7),
    blockingDate: row.blockingStatus === "Blocked" ? dateIn(seed, 8) : "—",
    lastUpdated: dateIn(seed, 10),
    victimName: person(seed, 11),
    victimGender: pick(GENDERS, seed, 12),
    victimAgeGroup: pick(AGE_GROUPS, seed, 13),
    suspectName: person(seed, 14),
    bank: pick(BANKS, seed, 15),
    wallet: pick(WALLETS, seed, 16),
    accountType: pick(ACCOUNT_TYPES, seed, 17),
    category: pick(CATEGORIES, seed, 18),
    subcategory: pick(SUBCATEGORIES, seed, 19),
    fraudType: pick(FRAUD_TYPES, seed, 20),
    firStatus: pick(FIR_STATUSES, seed, 21),
    chargesheetStatus: pick(CHARGESHEET_STATUSES, seed, 22),
    investigationStatus: pick(INVESTIGATION_STATUSES, seed, 23),
  };
  const imeiTemplate = details.imeiDetails["1234567890"][0];
  const imeis: ImeiRecord[] = Array.from({ length: Math.max(1, row.linkedImei) }, (_, k) => {
    const s2 = `${seed}|imei${k}`;
    const brandK = pick(DEVICE_BRANDS, s2, 1);
    return {
      imeiNumber: String(35 + Math.floor(seeded(s2, 2) * 60)) + String(Math.floor(seeded(s2, 3) * 8999999999) + 1000000000).padStart(13, "0").slice(0, 13),
      mobileNumber: row.mobileNumber,
      state: row.state,
      district: row.district,
      policeStation: base.policeStation,
      operator: base.operator,
      dateOfSimInsert: dateIn(s2, 4),
      imeiBlockingStatus: k === 0 ? row.blockingStatus : seeded(s2, 5) > 0.45 ? "Blocked" : "Not Blocked",
      imeiInternationalRoaming: k === 0 ? row.internationalRoaming : seeded(s2, 6) > 0.75 ? "Yes" : "No",
      plottedOnPratibimb: k === 0 ? row.plottedOnPratibimb : seeded(s2, 7) > 0.5 ? "Yes" : "No",
      deviceBrand: brandK,
      deviceModel: pick(DEVICE_MODELS[brandK], s2, 8),
      ceirStatus: pick(CEIR_STATUSES, s2, 9),
      dotStatus: pick(DOT_STATUSES, s2, 10),
      ...(k === 0 ? { dateOfSimInsert: imeiTemplate.dateOfSimInsert } : {}),
    };
  });
  return { ...base, imeis };
});

export const mobileByNumber = new Map(mobileRecords.map((m) => [m.mobileNumber, m]));

export const complaintRecords: ComplaintRecord[] = complaintCorpus.map((c, i) => {
  const seed = `${c.ackNumber}|${c.mobileNumber}`;
  const linked = mobileByNumber.get(c.mobileNumber);
  return {
    ...c,
    category: linked?.category ?? pick(CATEGORIES, seed, 1),
    subcategory: pick(SUBCATEGORIES, seed, 2),
    fraudType: pick(FRAUD_TYPES, seed, 3),
    firStatus: c.status === "FIR Registered" ? "FIR Registered" : pick(FIR_STATUSES, seed, 4),
    chargesheetStatus: c.status === "Chargesheet Filed" ? "Chargesheet Filed" : pick(CHARGESHEET_STATUSES, seed, 5),
    investigationStatus: c.status === "Closed" ? "Closed" : pick(INVESTIGATION_STATUSES, seed, 6),
    incidentDate: dateIn(seed, 7, "04"),
    lastUpdated: dateIn(seed, 8),
    riskLevel: riskFromAmount(c.amountInvolved, seed),
    victimName: linked?.victimName ?? person(seed, 9),
    victimGender: linked?.victimGender ?? pick(GENDERS, seed, 10),
    victimAgeGroup: linked?.victimAgeGroup ?? pick(AGE_GROUPS, seed, 11),
    suspectName: linked?.suspectName ?? person(seed, 12),
    bank: linked?.bank ?? pick(BANKS, seed, 13),
    wallet: linked?.wallet ?? pick(WALLETS, seed, 14),
    accountType: linked?.accountType ?? pick(ACCOUNT_TYPES, seed, 15),
    operator: linked?.operator ?? pick(TSPS, seed, i),
    imeiNumber: linked?.imeis[0]?.imeiNumber ?? details.imeiDetails["1234567890"][0].imeiNumber,
  };
});

export const complaintByAck = new Map(complaintRecords.map((c) => [c.ackNumber, c]));

export const imeiRecords: ImeiRecord[] = mobileRecords.flatMap((m) => m.imeis);
export const imeiByNumber = new Map(imeiRecords.map((r) => [r.imeiNumber, r]));

const posTemplate = details.posDetails["1234"][0];

export const posRecords: PosRecord[] = (() => {
  const byCode = new Map<string, PosRecord>();
  mobileRecords.forEach((m) => {
    const code = m.posCode;
    const seed = `pos|${code}`;
    const existing = byCode.get(code);
    if (existing) {
      existing.linkedNumbers.push(m.mobileNumber);
      return;
    }
    byCode.set(code, {
      ...posTemplate,
      posCode: code,
      posName: `${pick(LAST, seed, 1)} ${pick(["Mobile Store", "Telecom Point", "Communications", "Digital Hub"], seed, 2)}`,
      posAgentCode: `AGT-${100 + Math.floor(seeded(seed, 3) * 899)}`,
      posAgentName: person(seed, 4),
      posAddress: `${pick(["Main Bazar", "Station Road", "Civil Lines", "Market Chowk"], seed, 5)}, ${m.district}`,
      district: m.district,
      lsa: m.state,
      tsp: m.operator,
      latitude: Number((20 + seeded(seed, 6) * 12).toFixed(4)),
      longitude: Number((72 + seeded(seed, 7) * 16).toFixed(4)),
      totalSimsIssued: 80 + Math.floor(seeded(seed, 8) * 400),
      simsAlreadyDisconnected: 5 + Math.floor(seeded(seed, 9) * 60),
      suspectedSims: 1 + Math.floor(seeded(seed, 10) * 30),
      statusOfPos: pick(["Active", "Under Review", "Blacklisted", "Show Cause"], seed, 11),
      dateOfAction: dateIn(seed, 12),
      action: pick(["Show Cause Notice Issued", "Blacklisted", "FIR Registered", "Warning Issued"], seed, 13),
      state: m.state,
      circle: m.circle,
      riskLevel: pick(RISKS, seed, 14),
      linkedNumbers: [m.mobileNumber],
    });
  });
  // keep the authoritative seeded PoS from the dataset
  const seeded1234 = byCode.get("1234");
  if (seeded1234) byCode.set("1234", { ...seeded1234, ...posTemplate, state: posTemplate.lsa, circle: seeded1234.circle, riskLevel: seeded1234.riskLevel, linkedNumbers: seeded1234.linkedNumbers });
  return Array.from(byCode.values());
})();

export const posByCode = new Map(posRecords.map((p) => [p.posCode, p]));

export const operatorRecords = TSPS.map((tsp) => {
  const numbers = mobileRecords.filter((m) => m.operator === tsp);
  return {
    tsp,
    totalNumbers: numbers.length,
    blocked: numbers.filter((m) => m.blockingStatus === "Blocked").length,
    notBlocked: numbers.filter((m) => m.blockingStatus !== "Blocked").length,
    pratibimb: numbers.filter((m) => m.plottedOnPratibimb === "Yes").length,
    amount: numbers.reduce((a, m) => a + m.totalAmountInvolvedLac, 0),
    pos: posRecords.filter((p) => p.tsp === tsp).length,
    numbers,
  };
});

export const policeStationRecords = (() => {
  const map = new Map<string, { policeStation: string; state: string; district: string; numbers: MobileRecord[] }>();
  mobileRecords.forEach((m) => {
    const key = `${m.state}|${m.district}|${m.policeStation}`;
    const e = map.get(key) ?? { policeStation: m.policeStation, state: m.state, district: m.district, numbers: [] };
    e.numbers.push(m);
    map.set(key, e);
  });
  complaintRecords.forEach((c) => {
    const key = `${c.state}|${c.district}|${c.policeStation}`;
    if (!map.has(key)) map.set(key, { policeStation: c.policeStation, state: c.state, district: c.district, numbers: [] });
  });
  return Array.from(map.values());
})();

export const getComplaintsForMobile = (mobile: string) =>
  complaintRecords.filter((c) => c.mobileNumber === mobile);

export const getMobilesForPos = (code: string) => mobileRecords.filter((m) => m.posCode === code);

/* --------------------------------- filters --------------------------------- */

export interface IntelFilters {
  [key: string]: string[];
}

export interface FacetGroup {
  group: string;
  key: string;
  label: string;
  options: string[];
}

const uniq = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => !!v && v !== "—"))).sort();

export const FACETS: FacetGroup[] = [
  { group: "Location", key: "state", label: "State / LSA", options: uniq(mobileRecords.map((m) => m.state)) },
  { group: "Location", key: "district", label: "District", options: uniq(mobileRecords.map((m) => m.district)) },
  { group: "Location", key: "policeStation", label: "Police Station", options: uniq(mobileRecords.map((m) => m.policeStation)) },
  { group: "Location", key: "circle", label: "Circle", options: uniq(mobileRecords.map((m) => m.circle)) },
  { group: "Telecom", key: "operator", label: "Operator (TSP)", options: uniq(mobileRecords.map((m) => m.operator)) },
  { group: "Telecom", key: "posCode", label: "Point of Sale", options: uniq(mobileRecords.map((m) => m.posCode)) },
  { group: "Telecom", key: "internationalRoaming", label: "Intl. Roaming", options: uniq(mobileRecords.map((m) => m.internationalRoaming)) },
  { group: "Complaint", key: "category", label: "Category", options: [...CATEGORIES] },
  { group: "Complaint", key: "subcategory", label: "Subcategory", options: [...SUBCATEGORIES] },
  { group: "Complaint", key: "fraudType", label: "Fraud Type", options: [...FRAUD_TYPES] },
  { group: "Complaint", key: "firStatus", label: "FIR Status", options: [...FIR_STATUSES] },
  { group: "Complaint", key: "chargesheetStatus", label: "Chargesheet", options: [...CHARGESHEET_STATUSES] },
  { group: "Complaint", key: "investigationStatus", label: "Investigation", options: [...INVESTIGATION_STATUSES] },
  { group: "Risk", key: "riskLevel", label: "Risk Band", options: [...RISKS] },
  { group: "Technical", key: "blockingStatus", label: "Blocking Status", options: uniq(mobileRecords.map((m) => m.blockingStatus)) },
  { group: "Technical", key: "ceirStatus", label: "CEIR Status", options: [...CEIR_STATUSES] },
  { group: "Technical", key: "dotStatus", label: "DoT Status", options: [...DOT_STATUSES] },
  { group: "Technical", key: "syncStatus", label: "Sync Status", options: [...SYNC_STATUSES] },
  { group: "Technical", key: "plottedOnPratibimb", label: "Pratibimb Plot", options: uniq(mobileRecords.map((m) => m.plottedOnPratibimb)) },
  { group: "Technical", key: "samanvayaProfile", label: "SAMANVAYA Profile", options: uniq(mobileRecords.map((m) => m.samanvayaProfile)) },
  { group: "Misc", key: "deviceBrand", label: "Device Brand", options: [...DEVICE_BRANDS] },
  { group: "Misc", key: "deviceModel", label: "Device Model", options: uniq(mobileRecords.map((m) => m.deviceModel)) },
  { group: "Misc", key: "victimGender", label: "Gender", options: [...GENDERS] },
  { group: "Misc", key: "victimAgeGroup", label: "Age Group", options: [...AGE_GROUPS] },
  { group: "Misc", key: "bank", label: "Bank", options: [...BANKS] },
  { group: "Misc", key: "wallet", label: "Wallet", options: [...WALLETS] },
  { group: "Misc", key: "accountType", label: "Account Type", options: [...ACCOUNT_TYPES] },
];

export interface RangeFilters {
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
}

const parseDMY = (v?: string) => {
  if (!v) return undefined;
  if (v.includes("/")) {
    const [d, m, y] = v.split("/");
    return new Date(`${y}-${m}-${d}T00:00:00`).getTime();
  }
  const t = new Date(`${v}T00:00:00`).getTime();
  return Number.isNaN(t) ? undefined : t;
};

export function filterMobiles(records: MobileRecord[], filters: IntelFilters, range: RangeFilters = {}) {
  const keys = Object.keys(filters).filter((k) => filters[k]?.length);
  const from = parseDMY(range.fromDate);
  const to = parseDMY(range.toDate);
  return records.filter((r) => {
    for (const k of keys) {
      const v = String((r as unknown as Record<string, unknown>)[k] ?? "");
      if (!filters[k].includes(v)) return false;
    }
    if (range.minAmount != null && r.totalAmountInvolvedLac < range.minAmount) return false;
    if (range.maxAmount != null && r.totalAmountInvolvedLac > range.maxAmount) return false;
    if (from || to) {
      const t = parseDMY(r.lastUpdated);
      if (t == null || Number.isNaN(t)) return false;
      if (from && t < from) return false;
      if (to && t > to) return false;
    }
    return true;
  });
}

export function filterComplaints(records: ComplaintRecord[], filters: IntelFilters, range: RangeFilters = {}) {
  const keys = Object.keys(filters).filter((k) => filters[k]?.length);
  const from = parseDMY(range.fromDate);
  const to = parseDMY(range.toDate);
  return records.filter((r) => {
    for (const k of keys) {
      const raw = (r as unknown as Record<string, unknown>)[k];
      if (raw === undefined) continue; // facet not applicable to complaints
      if (!filters[k].includes(String(raw))) return false;
    }
    if (range.minAmount != null && r.amountInvolved < range.minAmount) return false;
    if (range.maxAmount != null && r.amountInvolved > range.maxAmount) return false;
    if (from || to) {
      const t = parseDMY(r.dateReported);
      if (t == null || Number.isNaN(t)) return false;
      if (from && t < from) return false;
      if (to && t > to) return false;
    }
    return true;
  });
}

/* -------------------------------- search ----------------------------------- */

export type EntityType =
  | "mobile"
  | "imei"
  | "complaint"
  | "pos"
  | "operator"
  | "state"
  | "district"
  | "ps"
  | "circular"
  | "officer"
  | "victim"
  | "suspect";

export interface SearchRecord {
  type: EntityType;
  id: string;
  title: string;
  subtitle: string;
  context: string;
  status: string;
  haystack: string;
}

const rec = (r: Omit<SearchRecord, "haystack">, extra: string[] = []): SearchRecord => ({
  ...r,
  haystack: [r.id, r.title, r.subtitle, r.context, r.status, ...extra].join(" ").toLowerCase(),
});

export const searchIndex: SearchRecord[] = [
  ...mobileRecords.map((m) =>
    rec(
      {
        type: "mobile",
        id: m.mobileNumber,
        title: m.mobileNumber,
        subtitle: `${m.operator} · ${m.ncrpComplaints} NCRP complaints · ₹${m.totalAmountInvolvedLac} L`,
        context: `${m.state} › ${m.district} › ${m.policeStation}`,
        status: m.blockingStatus,
      },
      [m.posCode, m.riskLevel, m.deviceBrand, m.deviceModel, m.victimName, m.suspectName, m.bank, m.wallet, ...m.imeis.map((i) => i.imeiNumber)],
    ),
  ),
  ...imeiRecords.map((i) =>
    rec({
      type: "imei",
      id: i.imeiNumber,
      title: i.imeiNumber,
      subtitle: `Handset ${i.deviceBrand} ${i.deviceModel} · SIM ${i.mobileNumber}`,
      context: `${i.state} › ${i.district} · ${i.operator}`,
      status: i.imeiBlockingStatus,
    }, [i.ceirStatus, i.dotStatus, i.mobileNumber]),
  ),
  ...complaintRecords.map((c) =>
    rec({
      type: "complaint",
      id: c.ackNumber,
      title: c.ackNumber,
      subtitle: `${c.category} · ${c.subcategory} · ₹${c.amountInvolved} L`,
      context: `${c.state} › ${c.district} › ${c.policeStation}`,
      status: c.status,
    }, [c.mobileNumber, c.victimName, c.suspectName, c.fraudType, c.bank, c.imeiNumber]),
  ),
  ...posRecords.map((p) =>
    rec({
      type: "pos",
      id: p.posCode,
      title: `${p.posCode} · ${p.posName}`,
      subtitle: `${p.posAgentName} (${p.posAgentCode}) · ${p.tsp}`,
      context: `${p.lsa} › ${p.district}`,
      status: p.statusOfPos,
    }, [p.posAddress, p.action, ...p.linkedNumbers]),
  ),
  ...operatorRecords.map((o) =>
    rec({
      type: "operator",
      id: o.tsp,
      title: o.tsp,
      subtitle: `${o.totalNumbers} suspect numbers · ${o.pos} points of sale`,
      context: "Telecom Service Provider",
      status: `${o.blocked} blocked`,
    }),
  ),
  ...stateRows.map((s) =>
    rec({
      type: "state",
      id: s.state,
      title: s.state,
      subtitle: `${s.totalSuspectNumbers} suspect numbers · ${s.blocked} blocked`,
      context: "State / LSA",
      status: `${s.plottedOnPratibimb} on Pratibimb`,
    }),
  ),
  ...stateRows.flatMap((s) =>
    getDistricts(s.state).map((d) =>
      rec({
        type: "district",
        id: `${s.state}|${d.district}`,
        title: d.district,
        subtitle: `${d.totalSuspectNumbers} suspect numbers · ${d.blocked} blocked`,
        context: s.state,
        status: `${d.notBlocked} pending`,
      }),
    ),
  ),
  ...policeStationRecords.map((p) =>
    rec({
      type: "ps",
      id: `${p.state}|${p.district}|${p.policeStation}`,
      title: p.policeStation,
      subtitle: `${p.numbers.length} suspect numbers on register`,
      context: `${p.state} › ${p.district}`,
      status: "Police Station",
    }),
  ),
  ...CIRCULARS.map((c) =>
    rec({
      type: "circular",
      id: c.id,
      title: c.title,
      subtitle: `${c.category} · ${c.issuedBy}`,
      context: `Issued ${c.date} · ${c.pages} pages`,
      status: c.priority,
    }, [c.summary]),
  ),
  ...OFFICERS.map((o) =>
    rec({
      type: "officer",
      id: o.id,
      title: o.name,
      subtitle: `${o.designation} · ${o.department}`,
      context: o.state,
      status: o.category,
    }, [o.phone, o.email]),
  ),
  ...Array.from(new Map(complaintRecords.map((c) => [c.victimName, c])).values()).map((c) =>
    rec({
      type: "victim",
      id: c.victimName,
      title: c.victimName,
      subtitle: `Victim · ${c.victimGender}, ${c.victimAgeGroup} · ${c.bank}`,
      context: `${c.state} › ${c.district}`,
      status: c.riskLevel,
    }, [c.ackNumber, c.mobileNumber]),
  ),
  ...Array.from(new Map(complaintRecords.map((c) => [c.suspectName, c])).values()).map((c) =>
    rec({
      type: "suspect",
      id: c.suspectName,
      title: c.suspectName,
      subtitle: `Suspect · linked to ${c.mobileNumber}`,
      context: `${c.state} › ${c.district}`,
      status: c.riskLevel,
    }, [c.ackNumber, c.imeiNumber]),
  ),
];

export const ENTITY_LABELS: Record<EntityType, string> = {
  mobile: "Mobile Number",
  imei: "IMEI",
  complaint: "Complaint",
  pos: "Point of Sale",
  operator: "Operator",
  state: "State / LSA",
  district: "District",
  ps: "Police Station",
  circular: "Circular",
  officer: "Officer",
  victim: "Victim",
  suspect: "Suspect",
};

export function searchAll(query: string, types?: EntityType[]) {
  const q = query.trim().toLowerCase();
  const pool = types?.length ? searchIndex.filter((r) => types.includes(r.type)) : searchIndex;
  if (!q) return pool;
  const terms = q.split(/\s+/);
  return pool.filter((r) => terms.every((t) => r.haystack.includes(t)));
}
