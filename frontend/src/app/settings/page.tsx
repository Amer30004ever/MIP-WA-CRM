import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Configure your MaVoid workspace"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar nav */}
        <div className="rounded-xl border border-border bg-card p-4">
          <nav className="space-y-1">
            {["WhatsApp", "Account", "Team", "Notifications", "Billing"].map(
              (item, i) => (
                <button
                  key={item}
                  id={`settings-nav-${item.toLowerCase()}`}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    i === 0
                      ? "bg-sidebar-accent text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </nav>
        </div>

        {/* Settings panel */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            WhatsApp Configuration
          </h2>
          <div className="space-y-4">
            {[
              { label: "Phone Number ID", id: "settings-phone-id", placeholder: "Enter Phone Number ID" },
              { label: "Business Account ID", id: "settings-biz-id", placeholder: "Enter Business Account ID" },
              { label: "Webhook Verify Token", id: "settings-verify-token", placeholder: "Enter verify token" },
            ].map(({ label, id, placeholder }) => (
              <div key={id} className="space-y-1.5">
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                  {label}
                </label>
                <input
                  id={id}
                  type="text"
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              id="settings-save"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
