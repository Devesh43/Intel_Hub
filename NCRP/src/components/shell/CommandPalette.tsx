import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  allPsMobileRows,
  complaintCorpus,
  details,
  getImeis,
  stateRows,
} from "@/lib/telecom";
import { BookMarked, Building2, FileText, Fingerprint, MapPin, Phone, Pin, History } from "lucide-react";
import { CIRCULARS } from "@/lib/directory";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const imeis = useMemo(
    () => allPsMobileRows.slice(0, 8).flatMap((r) => getImeis(r.mobileNumber).map((i) => ({ ...i, mobile: r.mobileNumber }))),
    [],
  );

  const go = (label: string, to: string, search?: Record<string, string>) => {
    setRecent((r) => [label, ...r.filter((x) => x !== label)].slice(0, 4));
    onOpenChange(false);
    navigate({ to, search: search as never });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search numbers, IMEI, complaints, PoS, circulars, states…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No intelligence records matched.</CommandEmpty>

        {recent.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recent.map((r) => (
                <CommandItem key={r} onSelect={() => onOpenChange(false)}>
                  <History className="size-3.5" /> {r}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Pinned">
          <CommandItem onSelect={() => go("Mobile dashboard", "/")}>
            <Pin className="size-3.5" /> Mobile number dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("Suspect registry", "/registry")}>
            <Pin className="size-3.5" /> Telecom suspect score registry
          </CommandItem>
          <CommandItem onSelect={() => go("Unified search", "/search")}>
            <Pin className="size-3.5" /> Unified search workspace
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Mobile numbers">
          {allPsMobileRows.slice(0, 8).map((r) => (
            <CommandItem
              key={`${r.state}-${r.district}-${r.mobileNumber}`}
              value={`${r.mobileNumber} ${r.district} ${r.state}`}
              onSelect={() => go(r.mobileNumber, "/search", { q: r.mobileNumber })}
            >
              <Phone className="size-3.5" />
              <span className="num">{r.mobileNumber}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {r.district}, {r.state}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Complaints">
          {complaintCorpus.slice(0, 6).map((c) => (
            <CommandItem key={c.ackNumber} value={`${c.ackNumber} ${c.district}`} onSelect={() => go(c.ackNumber, "/search", { q: c.ackNumber })}>
              <FileText className="size-3.5" />
              <span className="num">{c.ackNumber}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{c.policeStation}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="IMEI">
          {imeis.slice(0, 5).map((i, idx) => (
            <CommandItem key={`${i.imeiNumber}-${idx}`} value={`${i.imeiNumber} ${i.mobile}`} onSelect={() => go(i.imeiNumber, "/search", { q: i.imeiNumber })}>
              <Fingerprint className="size-3.5" />
              <span className="num">{i.imeiNumber}</span>
              <span className="num ml-auto text-[11px] text-muted-foreground">{i.mobile}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Points of sale">
          {Object.values(details.posDetails)
            .flat()
            .map((p) => (
              <CommandItem key={p.posCode} value={`${p.posCode} ${p.posName}`} onSelect={() => go(p.posName, "/pos")}>
                <Building2 className="size-3.5" /> {p.posName}
                <span className="ml-auto text-[11px] text-muted-foreground">PoS {p.posCode}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandGroup heading="States">
          {stateRows.map((s) => (
            <CommandItem key={s.state} onSelect={() => go(s.state, "/", { state: s.state })}>
              <MapPin className="size-3.5" /> {s.state}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Circulars">
          {CIRCULARS.slice(0, 4).map((c) => (
            <CommandItem key={c.id} onSelect={() => go(c.title, "/circulars")}>
              <BookMarked className="size-3.5" /> {c.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
