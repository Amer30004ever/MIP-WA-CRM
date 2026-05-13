import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Plus } from "lucide-react";

export default function TemplatesPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Templates"
        description="Manage WhatsApp message templates"
        action={
          <button
            id="templates-create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <input
            id="templates-search"
            type="search"
            placeholder="Search templates…"
            className="w-64 rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No templates yet"
          description="Create reusable WhatsApp message templates with variables"
          className="py-20"
        />
      </div>
    </AppLayout>
  );
}
