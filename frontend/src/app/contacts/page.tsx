import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCircle, Plus } from "lucide-react";

export default function ContactsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Contacts"
        description="Manage your WhatsApp contacts and customers"
        action={
          <button
            id="contacts-create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Contact
          </button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <input
            id="contacts-search"
            type="search"
            placeholder="Search contacts…"
            className="w-64 rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <EmptyState
          icon={<UserCircle className="h-6 w-6" />}
          title="No contacts yet"
          description="Contacts are created automatically when WhatsApp messages arrive"
          className="py-20"
        />
      </div>
    </AppLayout>
  );
}
