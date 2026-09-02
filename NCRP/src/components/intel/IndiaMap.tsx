import { useMemo, useState } from "react";
import { ArrowLeft, Layers, MapPin } from "lucide-react";
import geo from "@/data/indiaGeo.json";
import { formatNumber } from "@/lib/telecom";
import { cn } from "@/lib/utils";

interface Feature {
  s: string;
  d: string;
  p: string;
}

const GEO = geo as { width: number; height: number; features: Feature[] };

const bboxOf = (path: string) => {
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (let i = 0; i < nums.length - 1; i += 2) {
    x0 = Math.min(x0, nums[i]);
    x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]);
    y1 = Math.max(y1, nums[i + 1]);
  }
  return { x0, y0, x1, y1 };
};

const featureBBox = new Map<Feature, ReturnType<typeof bboxOf>>();
const bbox = (f: Feature) => {
  let b = featureBBox.get(f);
  if (!b) {
    b = bboxOf(f.p);
    featureBBox.set(f, b);
  }
  return b;
};

const stateBBox = (state: string) => {
  const parts = GEO.features.filter((f) => f.s === state).map(bbox);
  return {
    x0: Math.min(...parts.map((b) => b.x0)),
    y0: Math.min(...parts.map((b) => b.y0)),
    x1: Math.max(...parts.map((b) => b.x1)),
    y1: Math.max(...parts.map((b) => b.y1)),
  };
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export interface MapStat {
  total: number;
  blocked?: number;
  notBlocked?: number;
  plotted?: number;
}

/**
 * Interactive choropleth of India with state → district drill-down.
 * Colouring is driven by whichever dataset the caller passes in.
 */
export function IndiaMap({
  stateValues,
  districtValues,
  onSelectState,
  onSelectDistrict,
  height = 460,
  activeState,
  metricLabel = "suspect numbers",
}: {
  stateValues: Record<string, MapStat>;
  districtValues?: Record<string, MapStat>;
  onSelectState?: (state: string) => void;
  onSelectDistrict?: (state: string, district: string) => void;
  height?: number;
  activeState?: string;
  metricLabel?: string;
}) {
  const [zoomState, setZoomState] = useState<string | null>(activeState ?? null);
  const [hover, setHover] = useState<{ label: string; sub: string; x: number; y: number } | null>(null);

  const stateLookup = useMemo(() => {
    const m = new Map<string, MapStat>();
    Object.entries(stateValues).forEach(([k, v]) => m.set(norm(k), v));
    return m;
  }, [stateValues]);

  const districtLookup = useMemo(() => {
    const m = new Map<string, MapStat>();
    Object.entries(districtValues ?? {}).forEach(([k, v]) => m.set(norm(k.split("|").pop() ?? k), v));
    return m;
  }, [districtValues]);

  const max = useMemo(
    () => Math.max(1, ...Array.from(stateLookup.values()).map((v) => v.total)),
    [stateLookup],
  );
  const dmax = useMemo(
    () => Math.max(1, ...Array.from(districtLookup.values()).map((v) => v.total)),
    [districtLookup],
  );

  const view = useMemo(() => {
    if (!zoomState) return `0 0 ${GEO.width} ${GEO.height}`;
    const b = stateBBox(zoomState);
    const pad = Math.max((b.x1 - b.x0) * 0.08, 12);
    return `${b.x0 - pad} ${b.y0 - pad} ${b.x1 - b.x0 + pad * 2} ${b.y1 - b.y0 + pad * 2}`;
  }, [zoomState]);

  const features = zoomState ? GEO.features.filter((f) => f.s === zoomState) : GEO.features;

  const fillFor = (f: Feature) => {
    if (zoomState) {
      const v = districtLookup.get(norm(f.d))?.total ?? 0;
      const a = v ? 0.18 + (v / dmax) * 0.72 : 0.05;
      return `color-mix(in oklab, var(--cyan) ${a * 100}%, transparent)`;
    }
    const v = stateLookup.get(norm(f.s))?.total ?? 0;
    const a = v ? 0.16 + (v / max) * 0.74 : 0.04;
    return `color-mix(in oklab, var(--primary) ${a * 100}%, transparent)`;
  };

  const legendMax = zoomState ? dmax : max;

  return (
    <div className="relative" style={{ height }}>
      <div className="grid-canvas absolute inset-0 rounded-b-2xl bg-surface-2/30" />

      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        {zoomState ? (
          <button
            onClick={() => setZoomState(null)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="size-3" /> All states
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2/80 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
            <Layers className="size-3" /> Click a state to drill into districts
          </span>
        )}
        {zoomState && (
          <button
            onClick={() => onSelectState?.(zoomState)}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/50 bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur"
          >
            <MapPin className="size-3" /> Open {zoomState}
          </button>
        )}
      </div>

      <svg viewBox={view} className="absolute inset-0 size-full" role="img" aria-label="Choropleth map of India">
        {features.map((f, i) => {
          const stat = zoomState ? districtLookup.get(norm(f.d)) : stateLookup.get(norm(f.s));
          return (
            <path
              key={`${f.s}-${f.d}-${i}`}
              d={f.p}
              fill={fillFor(f)}
              stroke="var(--border-strong, var(--border))"
              strokeWidth={zoomState ? 0.8 : 0.5}
              vectorEffect="non-scaling-stroke"
              className={cn("cursor-pointer transition-[fill,opacity] hover:opacity-80")}
              onMouseMove={(e) => {
                const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({
                  label: zoomState ? f.d : f.s,
                  sub: stat
                    ? `${formatNumber(stat.total)} ${metricLabel}${stat.blocked != null ? ` · ${formatNumber(stat.blocked)} blocked` : ""}${stat.notBlocked != null ? ` · ${formatNumber(stat.notBlocked)} pending` : ""}${stat.plotted != null ? ` · ${formatNumber(stat.plotted)} Pratibimb` : ""}`
                    : "No records published for this jurisdiction",
                  x: e.clientX - r.left,
                  y: e.clientY - r.top,
                });
              }}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                if (zoomState) onSelectDistrict?.(zoomState, f.d);
                else {
                  setZoomState(f.s);
                  onSelectState?.(f.s);
                }
              }}
            />
          );
        })}
      </svg>

      {hover && (
        <div
          className="glass pointer-events-none absolute z-20 w-56 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl px-3 py-2 text-xs shadow-xl"
          style={{ left: hover.x, top: hover.y }}
        >
          <div className="font-semibold">{hover.label}</div>
          <div className="num mt-0.5 text-[10px] text-muted-foreground">{hover.sub}</div>
        </div>
      )}

      <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2 rounded-lg border border-border bg-surface-2/80 px-2.5 py-1 text-[10px] text-muted-foreground backdrop-blur">
        <span>0</span>
        <span
          className="h-2 w-24 rounded-full"
          style={{
            background: `linear-gradient(90deg, color-mix(in oklab, var(--${zoomState ? "cyan" : "primary"}) 8%, transparent), var(--${zoomState ? "cyan" : "primary"}))`,
          }}
        />
        <span className="num">{formatNumber(legendMax)}</span>
      </div>
    </div>
  );
}
