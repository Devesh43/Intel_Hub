import { Fingerprint, Globe2, Layers, Phone, ShieldAlert, Store, Users } from "lucide-react";
import { MetricCard } from "@/components/intel/MetricCard";
import { useApplyFilter, useIntelFilters } from "@/lib/filter-context";
import { formatNumber, type SummaryTile } from "@/lib/telecom";

const ICONS = [Phone, Globe2, Layers, Users, ShieldAlert, Fingerprint, Store];
const TONES = ["primary", "cyan", "violet", "emerald", "amber"] as const;

/** Maps a summary tile to the facet filter that best represents it. */
function filterForTile(key: string): [string, string] | null {
  if (key.includes("intl") || key.includes("roaming")) return ["internationalRoaming", "Yes"];
  if (key.includes("blocked") && !key.includes("unblocked")) return ["blockingStatus", "Blocked"];
  if (key.includes("unblocked")) return ["blockingStatus", "Not Blocked"];
  if (key.includes("mule")) return ["fraudType", "Mule Account"];
  if (key.includes("ocwc")) return ["riskLevel", "High Risk"];
  if (key.includes("blacklisted")) return ["statusOfPos", "Blacklisted"];
  if (key.includes("fir")) return ["firStatus", "FIR Registered"];
  if (key.includes("requested")) return ["ceirStatus", "CEIR Pending"];
  return null;
}

export function SummaryTiles({
  tiles,
  onOpenRecords,
}: {
  tiles: SummaryTile[];
  onOpenRecords?: () => void;
}) {
  const apply = useApplyFilter();
  const { reset } = useIntelFilters();

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((t, i) => {
        const Icon = ICONS[i % ICONS.length];
        const facet = filterForTile(t.key);
        return (
          <MetricCard
            key={t.key}
            id={t.key}
            index={i}
            title={t.title}
            value={t.value}
            unique={t.unique}
            icon={<Icon className="size-4" />}
            tone={TONES[i % TONES.length]}
            drillLabel="Open records"
            onClick={() => {
              if (facet) apply(facet[0], facet[1], t.title);
              else {
                reset();
                onOpenRecords?.();
              }
              onOpenRecords?.();
            }}
            footer={
              t.isFigureOnly ? (
                <span>Figure-only tile · click to segregate matching records</span>
              ) : undefined
            }
            hoverContent={
              t.buckets && (
                <div className="space-y-1.5 pb-2">
                  {t.buckets.map((b) => (
                    <div key={b.label} className="rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5">
                      <div className="text-[11px] font-medium">{b.label}</div>
                      <div className="num mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            apply("blockingStatus", "Blocked", `${b.label} · blocked`);
                            onOpenRecords?.();
                          }}
                          className="rounded-md border border-emerald/40 px-1.5 py-0.5 text-emerald hover:bg-emerald/10"
                        >
                          Blocked {formatNumber(b.blocked)}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            apply("blockingStatus", "Not Blocked", `${b.label} · not blocked`);
                            onOpenRecords?.();
                          }}
                          className="rounded-md border border-destructive/40 px-1.5 py-0.5 text-destructive hover:bg-destructive/10"
                        >
                          Not blocked {formatNumber(b.notBlocked)}
                        </button>
                        {b.plottedOnPratibimb > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              apply("plottedOnPratibimb", "Yes", `${b.label} · Pratibimb`);
                              onOpenRecords?.();
                            }}
                            className="rounded-md border border-cyan/40 px-1.5 py-0.5 text-cyan hover:bg-cyan/10"
                          >
                            Pratibimb {formatNumber(b.plottedOnPratibimb)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          />
        );
      })}
    </div>
  );
}
