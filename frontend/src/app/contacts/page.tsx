"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";
import {
  UserCircle,
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  Building,
  Loader2,
  X,
  UserPlus,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface WhatsAppContact {
  id: string;
  phone: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  companyId: string | null;
  company: Company | null;
  whatsAppContactId: string | null;
  whatsAppContact: WhatsAppContact | null;
  createdAt: string;
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const preFilledPhone = searchParams.get("create");

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    if (preFilledPhone) {
      setPhone(preFilledPhone);
      setName(`WhatsApp Contact ${preFilledPhone}`);
      setIsModalOpen(true);
    }
  }, [preFilledPhone]);

  // Queries
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await api.get<{ data: Contact[] } | Contact[]>("/contacts");
      return Array.isArray(res.data) ? res.data : (res.data as any).data || [];
    },
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await api.get<Company[]>("/companies");
      return res.data || [];
    },
  });

  // Mutation: Create CRM Contact
  const createContactMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      companyId?: string;
    }) => {
      return api.post("/contacts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to create contact record. Please check the backend connection.");
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setCompanyId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createContactMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      companyId: companyId || undefined,
    });
  };

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <AppLayout>
      <PageHeader
        title="CRM Contacts"
        description="View individual corporate customer profiles and mapping connections"
        action={
          <button
            id="contacts-create"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            New Contact
          </button>
        }
      />

      {/* Main Container */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        
        {/* Search Header Bar */}
        <div className="border-b border-border px-6 py-4 bg-muted/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              id="contacts-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, phone, email…"
              className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoadingContacts ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading CRM contacts…</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            icon={<UserCircle className="h-8 w-8 text-primary" />}
            title={searchQuery ? "No matching contacts found" : "No CRM contacts yet"}
            description={
              searchQuery
                ? "Try adjusting your search criteria or name."
                : "Create a customer profile or map one from your WhatsApp inbox thread shortcuts."
            }
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Create Contact
              </button>
            }
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Contact Coordinates</th>
                  <th className="px-6 py-4">WhatsApp Link</th>
                  <th className="px-6 py-4">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-muted-foreground/60" />
                        {contact.jobTitle || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      {contact.company ? (
                        <span className="flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-blue-500" />
                          {contact.company.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex flex-col gap-1 text-xs">
                        {contact.email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" /> {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" /> {contact.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {contact.whatsAppContactId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Active WhatsApp
                        </span>
                      ) : contact.phone ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
                          Not Associated
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(contact.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1">Create Customer Profile</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Add details to create a standard CRM business contact card.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdullah bin Fahd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+96650..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Director"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">B2B Company Account</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No Linked Company Account</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={createContactMutation.isPending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {createContactMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4.5 w-4.5" /> Save Customer Card
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
