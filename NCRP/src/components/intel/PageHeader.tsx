import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "motion/react";

export interface Crumb {
  label: string;
  to?: string;
  onClick?: () => void;
}

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  meta,
}: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="glass sticky top-0 z-30 -mx-6 mb-6 px-6 py-4">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3 opacity-60" />}
              {c.to ? (
                <Link to={c.to} className="transition-colors hover:text-primary">
                  {c.label}
                </Link>
              ) : c.onClick ? (
                <button onClick={c.onClick} className="transition-colors hover:text-primary">
                  {c.label}
                </button>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="min-w-0"
        >
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </motion.div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      </div>
      {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
    </div>
  );
}
