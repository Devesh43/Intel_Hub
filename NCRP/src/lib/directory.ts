import { seeded, stateRows, TSPS } from "./telecom";

export interface Circular {
  id: string;
  title: string;
  category: "Advisory" | "Standard Operating Procedure" | "DoT Directive" | "Legal" | "Technical";
  priority: "Critical" | "High" | "Routine";
  issuedBy: string;
  date: string;
  summary: string;
  pinned?: boolean;
  pages: number;
}

export const CIRCULARS: Circular[] = [
  {
    id: "CIR-2026-041",
    title: "Revised SOP for suspect mobile number blocking through DoT API",
    category: "Standard Operating Procedure",
    priority: "Critical",
    issuedBy: "MHA · I4C Telecom Cell",
    date: "18/05/2026",
    summary:
      "Defines the 24-hour turnaround for State/UT blocking requests, mandatory verification fields, and escalation to the DoT Task Force when TSP acknowledgement is delayed.",
    pinned: true,
    pages: 12,
  },
  {
    id: "CIR-2026-039",
    title: "Handling of IMEI received from DoT analysis marked fit for blocking",
    category: "DoT Directive",
    priority: "Critical",
    issuedBy: "Department of Telecommunications",
    date: "12/05/2026",
    summary:
      "CEIR-side workflow for IMEI validation, duplicate/cloned IMEI handling, and the audit trail to be preserved before a handset is barred across networks.",
    pinned: true,
    pages: 9,
  },
  {
    id: "CIR-2026-035",
    title: "Point of Sale accountability and blacklisting framework",
    category: "Legal",
    priority: "High",
    issuedBy: "MHA · I4C",
    date: "04/05/2026",
    summary:
      "Grounds for PoS blacklisting, TSP complaint procedure, FIR registration thresholds and quarterly reconciliation of the PoS repository.",
    pages: 16,
  },
  {
    id: "CIR-2026-030",
    title: "Plotting of suspect numbers on Pratibimb GIS",
    category: "Technical",
    priority: "High",
    issuedBy: "I4C Geo-Intelligence",
    date: "26/04/2026",
    summary: "Coordinate accuracy norms, location fetch intervals and integration keys for state consoles.",
    pages: 7,
  },
  {
    id: "CIR-2026-027",
    title: "Layer 1 mule account mobile numbers shared by banks and FIs",
    category: "Advisory",
    priority: "High",
    issuedBy: "I4C · Banking Liaison",
    date: "19/04/2026",
    summary: "Ingestion format, deduplication rules and disposal timelines for mule-linked telecom identifiers.",
    pages: 5,
  },
  {
    id: "CIR-2026-021",
    title: "International roaming footprint of Indian suspect numbers",
    category: "Advisory",
    priority: "Routine",
    issuedBy: "DoT Task Force",
    date: "02/04/2026",
    summary: "Coordination protocol with foreign carriers and evidentiary requirements for roaming logs.",
    pages: 6,
  },
  {
    id: "CIR-2026-014",
    title: "Seizure of mobile handsets and SIMs recorded on SAMANVAYA",
    category: "Standard Operating Procedure",
    priority: "Routine",
    issuedBy: "MHA · SAMANVAYA",
    date: "11/03/2026",
    summary: "Mandatory fields while recording seizures, chain of custody and inter-state handover.",
    pages: 11,
  },
  {
    id: "CIR-2026-008",
    title: "Telecom suspect score methodology",
    category: "Technical",
    priority: "Routine",
    issuedBy: "I4C Analytics",
    date: "22/02/2026",
    summary: "Weighting of complaints, amount involved, roaming, mule linkage and PoS risk in the suspect score.",
    pages: 8,
  },
];

export interface Officer {
  id: string;
  name: string;
  designation: string;
  department: string;
  state: string;
  phone: string;
  email: string;
  category: "Nodal Officer" | "DoT Task Force";
}

const FIRST = ["Arun", "Kavita", "Rakesh", "Meera", "Sandeep", "Nisha", "Vikram", "Anjali", "Rohit", "Sneha"];
const LAST = ["Sharma", "Iyer", "Khan", "Das", "Gupta", "Reddy", "Mehta", "Bose", "Nair", "Chauhan"];

export const OFFICERS: Officer[] = stateRows.flatMap((s, si) => {
  return [0, 1].map((k) => {
    const r = seeded(s.state + k, si);
    const nodal = k === 0;
    return {
      id: `${s.state}-${k}`,
      name: `${FIRST[Math.floor(r * FIRST.length)]} ${LAST[Math.floor(r * 10 * LAST.length) % LAST.length]}`,
      designation: nodal ? "State Nodal Officer (Cyber)" : "DoT Task Force Member",
      department: nodal ? "State Cyber Crime Cell" : `DoT LSA · ${TSPS[si % TSPS.length]} liaison`,
      state: s.state,
      phone: `+91 9${Math.floor(r * 899999999) + 100000000}`,
      email: `${nodal ? "nodal" : "dottf"}.${s.state.toLowerCase().replace(/\s+/g, "")}@ncrp.gov.in`,
      category: nodal ? "Nodal Officer" : "DoT Task Force",
    };
  });
});
