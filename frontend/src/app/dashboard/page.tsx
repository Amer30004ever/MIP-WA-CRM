import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { LayoutDashboard, MessageSquare, TrendingUp, Users, CheckSquare, DollarSign } from "lucide-react";

const stats = [
  { label: "Open Conversations", value: "—", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "New Leads",          value: "—", icon: TrendingUp,    color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Open Deals",         value: "—", icon: DollarSign,    color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { label: "Overdue Tasks",      value: "—", icon: CheckSquare,   color: "text-red-400",    bg: "bg-red-500/10" },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your WhatsApp CRM activity"
      />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Recent Conversations</h2>
          <p className="text-sm text-muted-foreground">
            Connect to the backend to see live data.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Pipeline Overview</h2>
          <p className="text-sm text-muted-foreground">
            Deal analytics will appear here once integrated.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
