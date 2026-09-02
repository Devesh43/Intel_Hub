import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "danger" | "warning" | "info" | "violet";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald/12 text-emerald border-emerald/30",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
  warning: "bg-amber/12 text-amber border-amber/30",
  info: "bg-primary/12 text-primary border-primary/35",
  violet: "bg-violet/12 text-violet border-violet/30",
};

export function toneForStatus(value: string): Tone {
  const v = value.toLowerCase();
  if (["blocked", "yes", "closed", "chargesheet filed", "active", "online"].includes(v)) return "success";
  if (["not blocked", "no", "blacklisted", "fir registered"].includes(v)) return v === "no" ? "neutral" : "danger";
  if (v.includes("under") || v.includes("review") || v.includes("pending")) return "warning";
  if (v.includes("evidence")) return "info";
  return "neutral";
}

export function StatusChip({
  children,
  tone,
  icon,
  className,
  dot,
  onClick,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  dot?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const t = tone ?? (typeof children === "string" ? toneForStatus(children) : "neutral");
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
    tones[t],
    onClick && "cursor-pointer transition-transform hover:scale-[1.04] hover:brightness-125",
    className,
  );
  const inner = (
    <>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        title={title}
        className={classes}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={classes} title={title}>
      {inner}
    </span>
  );
}

