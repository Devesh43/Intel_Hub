import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/intel/PageHeader";
import { Panel, PanelHeader } from "@/components/intel/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback & Support | NCRP Telecom Intelligence" },
      { name: "description", content: "Raise telecom module issues, data corrections and support requests to the I4C helpdesk." },
      { property: "og:title", content: "Feedback & Support | NCRP Telecom Intelligence" },
      { property: "og:description", content: "Raise telecom module issues, data corrections and support requests to the I4C helpdesk." },
    ],
  }),
  component: Feedback,
});

function Feedback() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHeader title="Feedback & Support" description="Report data issues or request assistance from the I4C helpdesk"
        crumbs={[{ label: "Telecom Module" }, { label: "Feedback" }]} />
      <Panel className="max-w-2xl overflow-hidden">
        <PanelHeader title="Raise a ticket" subtitle="Typical response within one working day" />
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Feedback submitted", { description: "Ticket routed to the I4C telecom helpdesk." });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="officer">Officer name</Label>
              <Input id="officer" required placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit / State</Label>
              <Input id="unit" required placeholder="e.g. Maharashtra Cyber" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" required placeholder="Short summary" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="details">Details</Label>
            <Textarea id="details" required rows={5} placeholder="Describe the issue, including ack numbers or mobile numbers where relevant" />
          </div>
          <Button type="submit" className="w-full sm:w-auto">{sent ? "Submitted" : "Submit feedback"}</Button>
        </form>
      </Panel>
    </>
  );
}
