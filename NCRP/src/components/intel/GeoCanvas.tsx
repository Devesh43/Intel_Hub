import { MapPin, Layers, Crosshair } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/telecom";

export interface MapPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  weight?: number;
  meta?: string;
}

/**
 * Lightweight SVG geo canvas for Indian coordinates (68–98 E, 6–37 N).
 * Supports pins, weighted clusters and a heat layer without external tiles.
 */
export function GeoCanvas({
  points,
  height = 340,
  onSelect,
}: {
  points: MapPoint[];
  height?: number;
  onSelect?: (p: MapPoint) => void;
}) {
  const [heat, setHeat] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  const project = (lat: number, lng: number) => ({
    x: ((lng - 67) / (98 - 67)) * 100,
    y: ((37.5 - lat) / (37.5 - 6)) * 100,
  });

  const maxWeight = Math.max(...points.map((p) => p.weight ?? 1), 1);

  return (
    <div className="relative" style={{ height }}>
      <div className="grid-canvas absolute inset-0 rounded-b-2xl bg-surface-2/40" />
      <div className="pointer-events-none absolute inset-0 rounded-b-2xl bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_65%)]" />

      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button
          onClick={() => setHeat((h) => !h)}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur transition-colors hover:text-primary",
            heat && "border-primary/50 text-primary",
          )}
        >
          <Layers className="size-3" /> Heat layer
        </button>
        <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2/80 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
          <Crosshair className="size-3" /> {points.length} pins
        </span>
      </div>

      <div className="absolute inset-0">
        {points.map((p) => {
          const { x, y } = project(p.lat, p.lng);
          const w = (p.weight ?? 1) / maxWeight;
          return (
            <div key={p.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
              {heat && (
                <span
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
                  style={{
                    width: 40 + w * 90,
                    height: 40 + w * 90,
                    background: `color-mix(in oklab, var(--cyan) ${18 + w * 45}%, transparent)`,
                  }}
                />
              )}
              <button
                onMouseEnter={() => setActive(p.id)}
                onMouseLeave={() => setActive(null)}
                onClick={() => onSelect?.(p)}
                aria-label={p.label}
                className="relative -translate-x-1/2 -translate-y-1/2 text-primary transition-transform hover:scale-125"
              >
                <MapPin className="size-4 drop-shadow" fill="currentColor" />
              </button>
              {active === p.id && (
                <div className="glass absolute z-20 w-52 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl px-3 py-2 text-xs shadow-xl">
                  <div className="font-semibold">{p.label}</div>
                  {p.meta && <div className="text-muted-foreground">{p.meta}</div>}
                  <div className="num mt-1 text-[10px] text-muted-foreground">
                    {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    {p.weight !== undefined && ` · ${formatNumber(p.weight)}`}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Coordinates of state/district hubs used for plotting aggregate intelligence. */
export const GEO: Record<string, { lat: number; lng: number }> = {
  Haryana: { lat: 29.06, lng: 76.09 },
  "Uttar Pradesh": { lat: 26.85, lng: 80.95 },
  Bihar: { lat: 25.6, lng: 85.13 },
  Rajasthan: { lat: 26.91, lng: 75.79 },
  Jharkhand: { lat: 23.61, lng: 85.28 },
  "West Bengal": { lat: 22.57, lng: 88.36 },
  Delhi: { lat: 28.61, lng: 77.21 },
  Maharashtra: { lat: 19.08, lng: 72.88 },
  Panchkula: { lat: 30.69, lng: 76.86 },
  Gurugram: { lat: 28.46, lng: 77.03 },
  Faridabad: { lat: 28.41, lng: 77.31 },
  Hisar: { lat: 29.15, lng: 75.72 },
  Lucknow: { lat: 26.85, lng: 80.95 },
  Noida: { lat: 28.54, lng: 77.39 },
  Kanpur: { lat: 26.45, lng: 80.33 },
  Varanasi: { lat: 25.32, lng: 82.97 },
  Begusarai: { lat: 25.42, lng: 86.13 },
  Patna: { lat: 25.59, lng: 85.14 },
  Nalanda: { lat: 25.13, lng: 85.44 },
  "Kathua handoff (JK liaison)": { lat: 32.37, lng: 75.52 },
};
