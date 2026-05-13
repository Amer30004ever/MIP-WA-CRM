import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingUp, Plus } from "lucide-react";

export default function LeadsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Leads"
        description="Track and manage your sales leads"
        action={
          <button
            id="leads-create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </button>
        }
      />

      {/* Table placeholder */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              id="leads-search"
              type="search"
              placeholder="Search leads…"
              className="w-64 rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <EmptyState
          icon={<TrendingUp className="h-6 w-6" />}
          title="No leads yet"
          description="Create your first lead or convert a WhatsApp conversation"
          action={
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" />
              Create Lead
            </button>
          }
          className="py-20"
        />
      </div>
    </AppLayout>
  );
}
