import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckSquare, Plus } from "lucide-react";

export default function TasksPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Tasks"
        description="Track follow-ups and action items"
        action={
          <button
            id="tasks-create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {["To Do", "In Progress", "Done"].map((col) => (
          <div key={col} className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <span className="text-sm font-medium text-foreground">{col}</span>
            </div>
            <EmptyState
              icon={<CheckSquare className="h-5 w-5" />}
              title="No tasks"
              className="py-10"
            />
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
