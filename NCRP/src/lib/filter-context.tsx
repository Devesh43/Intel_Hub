import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import type { IntelFilters, RangeFilters } from "@/lib/intel";

interface FilterCtx {
  filters: IntelFilters;
  range: RangeFilters;
  setFilters: (f: IntelFilters) => void;
  setRange: (r: RangeFilters) => void;
  toggle: (key: string, value: string) => void;
  only: (key: string, value: string) => void;
  reset: () => void;
  activeCount: number;
}

const Ctx = createContext<FilterCtx>({
  filters: {},
  range: {},
  setFilters: () => {},
  setRange: () => {},
  toggle: () => {},
  only: () => {},
  reset: () => {},
  activeCount: 0,
});

export const useIntelFilters = () => useContext(Ctx);

export function IntelFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<IntelFilters>({});
  const [range, setRange] = useState<RangeFilters>({});

  const toggle = useCallback((key: string, value: string) => {
    setFilters((f) => {
      const cur = f[key] ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...f, [key]: next };
    });
  }, []);

  const only = useCallback((key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: [value] }));
  }, []);

  const reset = useCallback(() => {
    setFilters({});
    setRange({});
  }, []);

  const activeCount =
    Object.values(filters).reduce((a, v) => a + (v?.length ?? 0), 0) +
    (range.minAmount != null ? 1 : 0) +
    (range.maxAmount != null ? 1 : 0) +
    (range.fromDate ? 1 : 0) +
    (range.toDate ? 1 : 0);

  const value = useMemo(
    () => ({ filters, range, setFilters, setRange, toggle, only, reset, activeCount }),
    [filters, range, toggle, only, reset, activeCount],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Applies a facet filter and makes sure the operator lands on a surface that
 * renders the segregated record set.
 */
export function useApplyFilter() {
  const { toggle, filters } = useIntelFilters();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return useCallback(
    (key: string, value: string, label?: string) => {
      const active = (filters[key] ?? []).includes(value);
      toggle(key, value);
      toast[active ? "info" : "success"](
        active ? `Filter removed · ${label ?? value}` : `Filter applied · ${label ?? value}`,
        { description: active ? "Records restored to the previous scope." : "Segregated records updated across the console." },
      );
      if (pathname !== "/" && pathname !== "/registry") {
        navigate({ to: "/registry" });
      }
    },
    [filters, toggle, navigate, pathname],
  );
}
