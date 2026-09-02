import { Fragment } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/telecom";
import { cn } from "@/lib/utils";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function IntelTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="num ml-auto font-medium">{formatNumber(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendArea({
  data,
  keys,
  height = 260,
  onSelect,
}: {
  data: Record<string, any>[];
  keys: { key: string; label: string; color: string }[];
  height?: number;
  onSelect?: (row: any) => void;
}) {
  return (
    <div style={{ height }} className="w-full px-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          onClick={(e: any) => e?.activePayload?.[0]?.payload && onSelect?.(e.activePayload[0].payload)}
          className={onSelect ? "cursor-pointer" : undefined}
        >
          <defs>
            {keys.map((k) => (
              <linearGradient key={k.key} id={`ga-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={k.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={k.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} width={48} tickFormatter={(v) => formatNumber(v as number)} />
          <Tooltip content={<IntelTooltip />} cursor={{ stroke: "var(--border-strong)" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {keys.map((k) => (
            <Area
              key={k.key}
              type="monotone"
              dataKey={k.key}
              name={k.label}
              stroke={k.color}
              strokeWidth={2}
              fill={`url(#ga-${k.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StackedBars({
  data,
  xKey,
  keys,
  height = 300,
  onSelect,
}: {
  data: Record<string, any>[];
  xKey: string;
  keys: { key: string; label: string; color: string }[];
  height?: number;
  onSelect?: (row: any) => void;
}) {
  return (
    <div style={{ height }} className="w-full px-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey={xKey} {...axis} interval={0} angle={-18} textAnchor="end" height={54} />
          <YAxis {...axis} width={48} tickFormatter={(v) => formatNumber(v as number)} />
          <Tooltip content={<IntelTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.35 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k) => (
            <Bar
              key={k.key}
              dataKey={k.key}
              name={k.label}
              stackId="a"
              fill={k.color}
              radius={[4, 4, 0, 0]}
              onClick={(d: any) => onSelect?.(d?.payload)}
              className={onSelect ? "cursor-pointer" : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLine({
  data,
  keys,
  height = 240,
  onSelect,
}: {
  data: Record<string, any>[];
  keys: { key: string; label: string; color: string }[];
  height?: number;
  onSelect?: (row: any) => void;
}) {
  return (
    <div style={{ height }} className="w-full px-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          onClick={(e: any) => e?.activePayload?.[0]?.payload && onSelect?.(e.activePayload[0].payload)}
          className={onSelect ? "cursor-pointer" : undefined}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} width={48} tickFormatter={(v) => formatNumber(v as number)} />
          <Tooltip content={<IntelTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k) => (
            <Line
              key={k.key}
              type="monotone"
              dataKey={k.key}
              name={k.label}
              stroke={k.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutStat({
  data,
  height = 240,
  onSelect,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  onSelect?: (name: string) => void;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ height }} className="relative w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<IntelTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="86%"
            paddingAngle={3}
            stroke="none"
            onClick={(d: any) => onSelect?.(d?.name)}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} className={onSelect ? "cursor-pointer" : undefined} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="num text-2xl font-semibold">{formatNumber(total)}</div>
          <div className="text-[10px] tracking-widest text-muted-foreground uppercase">total</div>
        </div>
      </div>
    </div>
  );
}

/** Density heatmap over a numeric matrix (states × metrics). */
export function Heatmap({
  rows,
  columns,
  cell,
  onSelect,
}: {
  rows: string[];
  columns: string[];
  cell: (row: string, col: string) => number;
  onSelect?: (row: string) => void;
}) {
  const values = rows.flatMap((r) => columns.map((c) => cell(r, c)));
  const max = Math.max(...values, 1);
  return (
    <div className="overflow-x-auto px-4 pb-4">
      <div
        className="grid min-w-[560px] gap-1.5"
        style={{ gridTemplateColumns: `140px repeat(${columns.length}, minmax(0,1fr))` }}
      >
        <div />
        {columns.map((c) => (
          <div key={c} className="pb-1 text-center text-[10px] tracking-widest text-muted-foreground uppercase">
            {c}
          </div>
        ))}
        {rows.map((r) => (
          <Fragment key={r}>
            <button
              key={`${r}-label`}
              onClick={() => onSelect?.(r)}
              className="truncate pr-2 text-left text-xs font-medium transition-colors hover:text-primary"
            >
              {r}
            </button>
            {columns.map((c) => {
              const v = cell(r, c);
              const alpha = 0.08 + (v / max) * 0.75;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => onSelect?.(r)}
                  title={`${r} · ${c}: ${formatNumber(v)}`}
                  className={cn(
                    "num h-9 rounded-lg border border-border/60 text-[11px] font-medium transition-transform hover:scale-[1.04]",
                  )}
                  style={{ background: `color-mix(in oklab, var(--primary) ${alpha * 100}%, transparent)` }}
                >
                  {formatNumber(v)}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** Treemap-style proportional grid. */
export function Treemap({
  items,
  onSelect,
}: {
  items: { name: string; value: number }[];
  onSelect?: (name: string) => void;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const palette = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];
  return (
    <div className="flex flex-wrap gap-1.5 p-4">
      {items.map((i, idx) => {
        const share = i.value / total;
        return (
          <button
            key={i.name}
            onClick={() => onSelect?.(i.name)}
            style={{
              flex: `${Math.max(share * 100, 8)} 1 120px`,
              background: `color-mix(in oklab, var(${palette[idx % palette.length]}) ${18 + share * 120}%, transparent)`,
            }}
            className="min-h-20 rounded-xl border border-border/70 p-3 text-left transition-transform hover:scale-[1.02]"
          >
            <div className="truncate text-xs font-medium">{i.name}</div>
            <div className="num mt-1 text-lg font-semibold">{formatNumber(i.value)}</div>
            <div className="text-[10px] text-muted-foreground">{(share * 100).toFixed(1)}% share</div>
          </button>
        );
      })}
    </div>
  );
}
