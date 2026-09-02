import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/intel/PageHeader";
import { HierarchyExplorer } from "@/components/drilldown/HierarchyExplorer";
import { StatusChip } from "@/components/intel/StatusChip";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) || undefined }),
  head: () => ({
    meta: [
      { title: "Unified Search | NCRP Telecom Intelligence" },
      { name: "description", content: "Search suspect mobile numbers, IMEI, points of sale and complaints across the telecom module." },
      { property: "og:title", content: "Unified Search | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Search suspect mobile numbers, IMEI, points of sale and complaints across the telecom module." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  return (
    <>
      <PageHeader title="Unified Search" description="Search across numbers, IMEI, PoS and complaints"
        crumbs={[{ label: "Telecom Module" }, { label: "Search" }]}
        meta={q ? <StatusChip tone="info">Query: {q}</StatusChip> : <StatusChip tone="neutral">Press Cmd/Ctrl + K</StatusChip>} />
      <HierarchyExplorer />
    </>
  );
}
