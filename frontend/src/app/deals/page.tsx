import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DollarSign, Plus } from "lucide-react";

const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

export default function DealsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Deals"
        description="Manage your sales pipeline"
        action={
          <button
            id="deals-create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Deal
          </button>
        }
      />

      {/* Kanban board skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage}
            className="w-64 shrink-0 rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {stage}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  0
                </span>
              </div>
            </div>
            <div className="p-3">
              <EmptyState
                icon={<DollarSign className="h-5 w-5" />}
                title="No deals"
                className="py-8 text-xs"
              />
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
