import { cn } from "@/lib/utils";
import { formatNumber, seeded, trendDelta, trendSeries } from "@/lib/telecom";
import { Panel } from "./Panel";
import { StatusChip } from "./StatusChip";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { motion, useMotionValue, useSpring, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 22 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return (
    <span ref={ref} className={cn("num", className)}>
      {formatNumber(display)}
    </span>
  );
}

export function Sparkline({ seed, value, tone = "primary" }: { seed: string; value: number; tone?: string }) {
  const data = trendSeries(seed, value, 12);
  const color = `var(--${tone})`;
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`spark-${seed}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            fill={`url(#spark-${seed})`}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface MetricCardProps {
  id: string;
  title: string;
  value: number;
  unique?: number;
  icon?: ReactNode;
  tone?: "primary" | "cyan" | "violet" | "emerald" | "amber";
  footer?: ReactNode;
  onDrill?: () => void;
  onClick?: () => void;
  drillLabel?: string;
  hoverContent?: ReactNode;
  index?: number;
}

export function MetricCard({
  id,
  title,
  value,
  unique,
  icon,
  tone = "primary",
  footer,
  onDrill,
  onClick,
  drillLabel = "Drill down",
  hoverContent,
  index = 0,
}: MetricCardProps) {
  const series = trendSeries(id, value, 12);
  const delta = trendDelta(series);
  const up = delta >= 0;
  const synced = 2 + Math.floor(seeded(id) * 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Panel className={cn("hover-lift relative overflow-hidden", onClick && "cursor-pointer hover:border-primary/50")}>

        <div className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full opacity-[0.13] blur-3xl" style={{ background: `var(--${tone})` }} />
        <div className="relative px-5 pt-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2"
                style={{ color: `var(--${tone})` }}
              >
                {icon}
              </span>
              <h3 className="min-w-0 text-xs leading-tight font-medium tracking-wide text-muted-foreground uppercase">
                {title}
              </h3>
            </div>
            <StatusChip tone={up ? "success" : "danger"} className="shrink-0">
              {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(delta).toFixed(1)}%
            </StatusChip>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <AnimatedNumber value={value} className="text-3xl leading-none font-semibold" />
            {unique !== undefined && (
              <span className="num pb-1 text-xs text-muted-foreground">
                {formatNumber(unique)} unique
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-2">
          <Sparkline seed={id} value={value} tone={tone} />
        </div>

        {hoverContent && (
          <div className="max-h-0 overflow-hidden px-5 opacity-0 transition-all duration-300 group-hover:max-h-64 group-hover:pb-1 group-hover:opacity-100">
            {hoverContent}
          </div>
        )}

        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border px-5 py-3">
          <div className="min-w-0 truncate text-[11px] text-muted-foreground">
            {footer ?? (
              <>
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald align-middle" />
                Last synced {synced}m ago
              </>
            )}
          </div>
          {(onDrill || onClick) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                (onDrill ?? onClick)?.();
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {drillLabel} <ArrowUpRight className="size-3" />
            </button>
          )}

        </div>
      </Panel>
    </motion.div>
  );
}
