import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Plus } from "lucide-react";

export default function CompaniesPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Companies"
        description="Organize your contacts by company"
        action={
          <button
            id="companies-create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Company
          </button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <input
            id="companies-search"
            type="search"
            placeholder="Search companies…"
            className="w-64 rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No companies yet"
          description="Add companies to group your contacts and deals"
          className="py-20"
        />
      </div>
    </AppLayout>
  );
}
