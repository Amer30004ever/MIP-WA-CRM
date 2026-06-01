"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";
import {
  TrendingUp,
  Plus,
  Search,
  DollarSign,
  User,
  Clock,
  Loader2,
  Phone,
  Briefcase,
  AlertCircle,
  X,
} from "lucide-react";

interface WhatsAppContact {
  id: string;
  phone: string;
  name: string | null;
}

interface AssignedUser {
  id: string;
  name: string;
  email: string;
}

interface Lead {
  id: string;
  title: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "LOST";
  value: number | null;
  whatsAppContactId: string | null;
  whatsAppContact: WhatsAppContact | null;
  assignedToId: string | null;
  assignedTo: AssignedUser | null;
  createdAt: string;
}

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const preFilledPhone = searchParams.get("create");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Lead["status"]>("NEW");
  const [assignedToId, setAssignedToId] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  // Auto-trigger creation modal if pre-filled phone number is present in URL
  useEffect(() => {
    if (preFilledPhone) {
      setPhoneInput(preFilledPhone);
      setTitle(`Lead for ${preFilledPhone}`);
      setIsModalOpen(true);
    }
  }, [preFilledPhone]);

  // Queries
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await api.get<{ data: Lead[] } | Lead[]>("/leads");
      // Handle either raw array or { data: Array } response envelope
      const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
      return list;
    },
  });

  const { data: teamUsers = [] } = useQuery<TeamUser[]>({
    queryKey: ["team-users"],
    queryFn: async () => {
      const res = await api.get<TeamUser[]>("/auth/users");
      return res.data || [];
    },
  });

  // Mutation: Create Lead
  const createLeadMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      value: number;
      status: Lead["status"];
      assignedToId?: string;
      whatsAppContactId?: string;
    }) => {
      return api.post("/leads", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to create lead. Please check the backend connection.");
    },
  });

  const resetForm = () => {
    setTitle("");
    setValue("");
    setStatus("NEW");
    setAssignedToId("");
    setPhoneInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createLeadMutation.mutate({
      title: title.trim(),
      value: parseFloat(value) || 0,
      status,
      assignedToId: assignedToId || undefined,
    });
  };

  // Filter Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.whatsAppContact?.phone.includes(searchQuery) ||
      lead.assignedTo?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate high-level stats
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const pipelineValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);

  const getStatusColor = (s: Lead["status"]) => {
    switch (s) {
      case "NEW":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "CONTACTED":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "QUALIFIED":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "UNQUALIFIED":
        return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
      case "LOST":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Leads Management"
        description="Monitor, qualify, and convert WhatsApp leads into sales opportunities"
        action={
          <button
            id="leads-create"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            New Lead
          </button>
        }
      />

      {/* Leads Statistics Banner */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Leads</p>
            <h3 className="text-2xl font-bold text-foreground">{totalLeads}</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">New / Uncontacted</p>
            <h3 className="text-2xl font-bold text-foreground">{newLeads}</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pipeline Value</p>
            <h3 className="text-2xl font-bold text-foreground">${pipelineValue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        
        {/* Controls / Filter Bar */}
        <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/10">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              id="leads-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, phone or agent…"
              className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "LOST"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                  statusFilter === tab
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        {isLoadingLeads ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading leads…</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-8 w-8 text-primary" />}
            title={searchQuery || statusFilter !== "ALL" ? "No matching leads found" : "No leads yet"}
            description={
              searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search filters or status selection."
                : "Create your very first lead or link an ongoing chat conversation."
            }
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Create Lead
              </button>
            }
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Lead Opportunity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">WhatsApp Contact</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {lead.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {lead.value ? `$${lead.value.toLocaleString()}` : "$0"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {lead.whatsAppContact ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Phone className="h-3.5 w-3.5" />
                          {lead.whatsAppContact.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-muted-foreground/80" />
                        {lead.assignedTo?.name || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(lead.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1">Create New Sales Lead</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Fill in the parameters below to log a new opportunity in the CRM.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Opportunity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saudi Real Estate Deal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Lead Value ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Stage Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="UNQUALIFIED">Unqualified</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Assigned Agent</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Unassigned</option>
                  {teamUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              {phoneInput && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-center gap-3">
                  <Phone className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-800">Linked WhatsApp Contact</h5>
                    <p className="text-[10px] text-emerald-700 font-mono">{phoneInput}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {createLeadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Briefcase className="h-4.5 w-4.5" /> Save Opportunity
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
