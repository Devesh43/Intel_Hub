import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ChevronDown, ShieldAlert, X } from "lucide-react";
import { StatusChip } from "./StatusChip";
import { cn } from "@/lib/utils";

export type Severity = "critical" | "high" | "info";

const severityStyles: Record<Severity, { ring: string; text: string; tone: "danger" | "warning" | "info" }> = {
  critical: { ring: "border-destructive/40", text: "text-destructive", tone: "danger" },
  high: { ring: "border-amber/40", text: "text-amber", tone: "warning" },
  info: { ring: "border-primary/40", text: "text-primary", tone: "info" },
};

export function AlertBanner({
  severity = "critical",
  title,
  message,
  details,
  onViewDetails,
}: {
  severity?: Severity;
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  onViewDetails?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const s = severityStyles[severity];

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className={cn("panel sweep mb-5 overflow-hidden border", s.ring)}
          role="alert"
        >
          <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-5 py-4">
            <span className={cn("pulse-dot mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-2", s.text)}>
              {severity === "info" ? <ShieldAlert className="size-4" /> : <AlertTriangle className="size-4" />}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
                <StatusChip tone={s.tone} dot>
                  {severity}
                </StatusChip>
                <StatusChip tone="info" dot>
                  NCRP live feed
                </StatusChip>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message}</p>

              <AnimatePresence initial={false}>
                {open && details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {details.map((d) => (
                        <div key={d.label} className="rounded-xl border border-border bg-surface-2/60 px-3 py-2">
                          <div className="text-[10px] tracking-widest text-muted-foreground uppercase">{d.label}</div>
                          <div className="num mt-0.5 text-sm font-medium">{d.value}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-3 flex flex-wrap gap-2">
                {details && (
                  <button
                    onClick={() => setOpen((o) => !o)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {open ? "Collapse" : "Expand"} indicators
                    <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
                  </button>
                )}
                {onViewDetails && (
                  <button
                    onClick={onViewDetails}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    View details
                  </button>
                )}
              </div>
            </div>
            <button
              aria-label="Dismiss alert"
              onClick={() => setDismissed(true)}
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
