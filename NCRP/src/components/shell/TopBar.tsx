import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signOut } from "@/lib/auth";
import {
  Bell,
  Clock,
  Command as CommandIcon,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { StatusChip } from "@/components/intel/StatusChip";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const [dark, setDark] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const notifications = [
    { title: "Jamtara cluster spike", detail: "42 new suspect numbers in 6h", tone: "danger" as const },
    { title: "TSP blocking SLA breach", detail: "VI · 3 requests beyond 24h", tone: "warning" as const },
    { title: "Pratibimb sync complete", detail: "24,240 plots refreshed", tone: "success" as const },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 shadow-lg">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onOpenPalette}
            className="group flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface-2/70 px-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 lg:max-w-md"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="truncate">Search suspect mobile, IMEI, PoS, complaint…</span>
            <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 text-[10px] sm:inline-flex">
              <CommandIcon className="size-2.5" />K
            </kbd>
          </button>

          <div className="hidden items-center gap-2 xl:flex">
            <StatusChip tone="success" dot>
              Secure gateway
            </StatusChip>
            <StatusChip tone="info">
              <RefreshCw className="size-3 animate-spin [animation-duration:4s]" /> NCRP sync 3m
            </StatusChip>
            <StatusChip tone="violet">
              <Wifi className="size-3" /> CEIR 14ms
            </StatusChip>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface-2/70 px-2.5 py-1.5 text-[11px] text-muted-foreground md:flex">
            <Clock className="size-3.5" />
            <span className="num">
              {now.toLocaleDateString("en-GB")} · {now.toLocaleTimeString("en-GB")}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative grid size-9 place-items-center rounded-xl border border-border bg-surface-2/70 transition-colors hover:text-primary" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Operational alerts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((n) => (
                <DropdownMenuItem key={n.title} className="flex-col items-start gap-1" onClick={() => navigate({ to: "/registry" })}>
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-xs font-medium">{n.title}</span>
                    <StatusChip tone={n.tone} dot>
                      live
                    </StatusChip>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{n.detail}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
            className="grid size-9 place-items-center rounded-xl border border-border bg-surface-2/70 transition-colors hover:text-primary"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2/70 px-2 py-1.5 transition-colors hover:border-primary/50">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[12px] font-medium">HQ_ANALYST</span>
                <span className="block text-[10px] tracking-wider text-muted-foreground uppercase">Level 2 audit</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Signed in · LEA HQ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/registry">Suspect registry</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/contacts/nodal">Nodal officers</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/feedback">Feedback</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  signOut();
                  navigate({ to: "/login", replace: true });
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export const topbarClasses = cn();
