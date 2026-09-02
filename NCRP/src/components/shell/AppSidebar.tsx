import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive,
  BookMarked,
  ChevronDown,
  Contact,
  Fingerprint,
  Gauge,
  LayoutDashboard,
  MessageSquareHeart,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Search,
  ShieldHalf,
  Smartphone,
  Store,
  Cpu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavLeaf {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavLeaf[];
}
type NavItem = NavLeaf | NavGroup;

const isGroup = (i: NavItem): i is NavGroup => "children" in i;

const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Telecom module",
    items: [
      {
        label: "Mobile Number",
        icon: Smartphone,
        children: [
          { label: "Dashboard", to: "/", icon: LayoutDashboard },
          { label: "Performance Report", to: "/mobile/performance", icon: Gauge },
          { label: "Archive Report", to: "/mobile/archive", icon: Archive },
          { label: "Seized on SAMANVAYA", to: "/mobile/samanvaya", icon: ShieldHalf },
        ],
      },
      {
        label: "IMEI Number",
        icon: Fingerprint,
        children: [
          { label: "Dashboard", to: "/imei", icon: LayoutDashboard },
          { label: "Performance Report", to: "/imei/performance", icon: Gauge },
          { label: "Seized on SAMANVAYA", to: "/imei/samanvaya", icon: ShieldHalf },
          { label: "DoT Analysis — fit for blocking", to: "/imei/dot-analysis", icon: Cpu },
        ],
      },
      {
        label: "SIM Point of Sale",
        icon: Store,
        children: [
          { label: "Dashboard", to: "/pos", icon: LayoutDashboard },
          { label: "Performance Report", to: "/pos/performance", icon: Gauge },
        ],
      },
    ],
  },
  {
    heading: "Intelligence & registries",
    items: [
      { label: "Unified Search", to: "/search", icon: Search },
      { label: "Telecom Suspect Registry", to: "/registry", icon: Radar },
    ],
  },
  {
    heading: "Support & directories",
    items: [
      {
        label: "Contact Details",
        icon: Contact,
        children: [
          { label: "Nodal Officer List", to: "/contacts/nodal", icon: Contact },
          { label: "DoT Task Force List", to: "/contacts/dot", icon: ShieldHalf },
        ],
      },
      { label: "Circulars", to: "/circulars", icon: BookMarked },
      { label: "Feedback & Suggestions", to: "/feedback", icon: MessageSquareHeart },
    ],
  },
];

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<string[]>(["Mobile Number"]);

  const toggle = (label: string) =>
    setOpen((o) => (o.includes(label) ? o.filter((l) => l !== label) : [...o, label]));

  const active = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 268 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Radar className="size-4.5" />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="min-w-0"
            >
              <div className="truncate text-[13px] leading-tight font-semibold tracking-tight">NCRP Telecom</div>
              <div className="truncate text-[10px] tracking-widest text-muted-foreground uppercase">
                Intelligence console
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5">
            {!collapsed && (
              <div className="px-2 pb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {section.heading}
              </div>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                if (!isGroup(item)) {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={item.label}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",
                          active(item.to)
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                        )}
                      >
                        {active(item.to) && (
                          <motion.span
                            layoutId="nav-active"
                            className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          />
                        )}
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                }

                const Icon = item.icon;
                const expanded = open.includes(item.label) && !collapsed;
                const groupActive = item.children.some((c) => active(c.to));
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => (collapsed ? onToggle() : toggle(item.label))}
                      aria-expanded={expanded}
                      title={item.label}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",
                        groupActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                        "hover:bg-sidebar-accent/60",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", groupActive && "text-primary")} />
                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                          <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
                        </>
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="ml-4 overflow-hidden border-l border-sidebar-border pl-2"
                        >
                          {item.children.map((c) => (
                            <li key={c.to}>
                              <Link
                                to={c.to}
                                className={cn(
                                  "my-0.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors",
                                  active(c.to)
                                    ? "bg-primary/12 font-medium text-primary"
                                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                                )}
                              >
                                <c.icon className="size-3.5 shrink-0" />
                                <span className="truncate">{c.label}</span>
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </motion.aside>
  );
}
