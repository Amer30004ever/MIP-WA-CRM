"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";
import {
  DollarSign,
  Plus,
  Loader2,
  Building,
  User,
  ArrowRight,
  ArrowLeft,
  X,
  PlusCircle,
  Briefcase,
  AlertCircle,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
}

interface TeamUser {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: "NEW" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
  companyId: string | null;
  company: Company | null;
  contactId: string | null;
  contact: Contact | null;
  assignedToId: string | null;
  assignedTo: TeamUser | null;
  createdAt: string;
}

const STAGES = [
  { id: "NEW", label: "New Lead", color: "border-t-amber-500 bg-amber-500/5 text-amber-600" },
  { id: "QUALIFIED", label: "Qualified", color: "border-t-blue-500 bg-blue-500/5 text-blue-600" },
  { id: "PROPOSAL", label: "Proposal Sent", color: "border-t-purple-500 bg-purple-500/5 text-purple-600" },
  { id: "NEGOTIATION", label: "Negotiation", color: "border-t-pink-500 bg-pink-500/5 text-pink-600" },
  { id: "WON", label: "Closed Won", color: "border-t-emerald-500 bg-emerald-500/5 text-emerald-600" },
  { id: "LOST", label: "Closed Lost", color: "border-t-rose-500 bg-rose-500/5 text-rose-600" },
] as const;

type StageType = typeof STAGES[number]["id"];

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<StageType>("NEW");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  // Queries
  const { data: deals = [], isLoading: isLoadingDeals } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await api.get<{ data: Deal[] } | Deal[]>("/deals");
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

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await api.get<Contact[]>("/contacts");
      return res.data || [];
    },
  });

  const { data: teamUsers = [] } = useQuery<TeamUser[]>({
    queryKey: ["team-users"],
    queryFn: async () => {
      const res = await api.get<TeamUser[]>("/auth/users");
      return res.data || [];
    },
  });

  // Mutation: Create Deal
  const createDealMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      value: number;
      stage: StageType;
      companyId?: string;
      contactId?: string;
      assignedToId?: string;
    }) => {
      return api.post("/deals", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to create deal card. Please check the backend connection.");
    },
  });

  // Mutation: Move Deal Stage
  const moveDealMutation = useMutation({
    mutationFn: async ({ id, nextStage }: { id: string; nextStage: StageType }) => {
      return api.patch(`/deals/${id}`, { stage: nextStage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setValue("");
    setStage("NEW");
    setCompanyId("");
    setContactId("");
    setAssignedToId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !value) return;

    createDealMutation.mutate({
      title: title.trim(),
      value: parseFloat(value) || 0,
      stage,
      companyId: companyId || undefined,
      contactId: contactId || undefined,
      assignedToId: assignedToId || undefined,
    });
  };

  const handleMoveStage = (dealId: string, currentStage: StageType, direction: "next" | "prev") => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < STAGES.length) {
      moveDealMutation.mutate({ id: dealId, nextStage: STAGES[nextIndex].id });
    }
  };

  // Get total stats per column
  const getStageStats = (stageId: StageType) => {
    const stageDeals = deals.filter((d) => d.stage === stageId);
    const sum = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);
    return {
      count: stageDeals.length,
      value: sum,
    };
  };

  return (
    <AppLayout>
      <PageHeader
        title="Sales Pipeline"
        description="Monitor opportunity stages, values, and assignees in a visual Kanban board"
        action={
          <button
            id="deals-create"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            New Deal
          </button>
        }
      />

      {isLoadingDeals ? (
        <div className="flex h-96 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading sales board…</span>
        </div>
      ) : (
        /* KANBAN SCROLL CONTAINER */
        <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-17rem)] min-w-full">
          {STAGES.map((col) => {
            const { count, value: stageSum } = getStageStats(col.id);
            const colDeals = deals.filter((d) => d.stage === col.id);

            return (
              <div
                key={col.id}
                className="w-72 shrink-0 rounded-2xl border border-border bg-card flex flex-col shadow-sm max-h-full"
              >
                {/* Stage Header */}
                <div className={`px-4 py-3.5 rounded-t-2xl border-t-4 border-b border-border ${col.color} flex flex-col gap-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-3xs font-extrabold shadow-sm border border-border">
                      {count}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground opacity-90 font-mono">
                    ${stageSum.toLocaleString()}
                  </span>
                </div>

                {/* Card Flow area */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-muted/5">
                  {colDeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border/60 rounded-xl text-muted-foreground bg-background/50">
                      <AlertCircle className="h-4.5 w-4.5 opacity-40 mb-1" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">No Deals</span>
                    </div>
                  ) : (
                    colDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-xl border border-border bg-background p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col gap-3 relative group"
                      >
                        <div>
                          <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                            {deal.title}
                          </h4>
                          <span className="text-xs font-bold text-primary font-mono inline-block mt-1">
                            ${deal.value.toLocaleString()}
                          </span>
                        </div>

                        {/* Relations info */}
                        <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                          {deal.company && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Building className="h-3 w-3 shrink-0 text-blue-500" />
                              <span className="truncate">{deal.company.name}</span>
                            </span>
                          )}
                          {deal.contact && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <User className="h-3 w-3 shrink-0 text-amber-500" />
                              <span className="truncate">{deal.contact.name}</span>
                            </span>
                          )}
                          {deal.assignedTo && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-foreground/80">
                              <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold shrink-0">
                                {deal.assignedTo.name.substring(0, 1).toUpperCase()}
                              </span>
                              <span className="truncate">{deal.assignedTo.name}</span>
                            </span>
                          )}
                        </div>

                        {/* Stage quick transition arrows */}
                        <div className="flex justify-between items-center border-t border-border/40 pt-2 mt-1">
                          <button
                            onClick={() => handleMoveStage(deal.id, col.id, "prev")}
                            disabled={col.id === "NEW"}
                            className="p-1 rounded bg-muted hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition-all"
                            title="Move back"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Move</span>
                          <button
                            onClick={() => handleMoveStage(deal.id, col.id, "next")}
                            disabled={col.id === "LOST"}
                            className="p-1 rounded bg-muted hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition-all"
                            title="Move forward"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1">Add Pipeline Deal</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Add a contract deal card to track transaction stages in your sales boards.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Deal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise License Expansion"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Deal Value ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Pipeline Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">B2B Company Account</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No Associated Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">CRM Contact Profile</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No Associated Contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Assigned Agent</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={createDealMutation.isPending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {createDealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="h-4.5 w-4.5" /> Save Pipeline Deal
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
