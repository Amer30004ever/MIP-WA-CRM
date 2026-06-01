"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";
import {
  CheckSquare,
  Plus,
  Loader2,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  X,
  PlusCircle,
  Briefcase,
  AlertCircle,
  Clock,
} from "lucide-react";

interface TeamUser {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  title: string;
}

interface Deal {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignedToId: string | null;
  assignedTo: TeamUser | null;
  leadId: string | null;
  lead: Lead | null;
  dealId: string | null;
  deal: Deal | null;
  createdAt: string;
}

const COLUMNS = [
  { id: "TODO", label: "To Do", color: "border-t-amber-500 bg-amber-500/5 text-amber-600" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-t-blue-500 bg-blue-500/5 text-blue-600" },
  { id: "DONE", label: "Completed", color: "border-t-emerald-500 bg-emerald-500/5 text-emerald-600" },
] as const;

type TaskStatusType = typeof COLUMNS[number]["id"];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatusType>("TODO");
  const [assignedToId, setAssignedToId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [dealId, setDealId] = useState("");

  // Queries
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.get<{ data: Task[] } | Task[]>("/tasks");
      return Array.isArray(res.data) ? res.data : (res.data as any).data || [];
    },
  });

  const { data: teamUsers = [] } = useQuery<TeamUser[]>({
    queryKey: ["team-users"],
    queryFn: async () => {
      const res = await api.get<TeamUser[]>("/auth/users");
      return res.data || [];
    },
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await api.get<{ data: Lead[] } | Lead[]>("/leads");
      return Array.isArray(res.data) ? res.data : (res.data as any).data || [];
    },
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await api.get<{ data: Deal[] } | Deal[]>("/deals");
      return Array.isArray(res.data) ? res.data : (res.data as any).data || [];
    },
  });

  // Mutation: Create Task
  const createTaskMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      dueDate?: string;
      status: TaskStatusType;
      assignedToId?: string;
      leadId?: string;
      dealId?: string;
    }) => {
      return api.post("/tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to create task record. Please check the backend connection.");
    },
  });

  // Mutation: Move Task Status
  const moveTaskMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: TaskStatusType }) => {
      return api.patch(`/tasks/${id}`, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setStatus("TODO");
    setAssignedToId("");
    setLeadId("");
    setDealId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTaskMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      status,
      assignedToId: assignedToId || undefined,
      leadId: leadId || undefined,
      dealId: dealId || undefined,
    });
  };

  const handleMoveStatus = (taskId: string, currentStatus: TaskStatusType, direction: "next" | "prev") => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === currentStatus);
    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
      moveTaskMutation.mutate({ id: taskId, nextStatus: COLUMNS[nextIndex].id });
    }
  };

  // Check if a task is overdue
  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    // Normalize times
    date.setHours(23, 59, 59, 999);
    return date < now;
  };

  return (
    <AppLayout>
      <PageHeader
        title="Tasks Checklist"
        description="Schedule follow-up actions and track deadline completions per sales representative"
        action={
          <button
            id="tasks-create"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            New Task
          </button>
        }
      />

      {isLoadingTasks ? (
        <div className="flex h-96 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading tasks board…</span>
        </div>
      ) : (
        /* KANBAN SECTION */
        <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-17rem)] min-w-full">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="rounded-2xl border border-border bg-card flex flex-col shadow-sm max-h-full"
              >
                {/* Column Header */}
                <div className={`px-4 py-3.5 rounded-t-2xl border-t-4 border-b border-border ${col.color} flex items-center justify-between`}>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-3xs font-extrabold shadow-sm border border-border">
                    {colTasks.length}
                  </span>
                </div>

                {/* Card Flow area */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-muted/5">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/60 rounded-xl text-muted-foreground bg-background/50">
                      <CheckSquare className="h-5 w-5 opacity-40 mb-1" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">No Tasks</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const dateOverdue = task.status !== "DONE" && isOverdue(task.dueDate);

                      return (
                        <div
                          key={task.id}
                          className={`rounded-xl border bg-background p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 relative border-border ${
                            dateOverdue ? "border-red-500/20 bg-red-500/[0.01]" : ""
                          }`}
                        >
                          <div>
                            <h4 className="font-semibold text-sm text-foreground leading-snug">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Date and Target links */}
                          <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 text-[11px] font-semibold ${
                                dateOverdue ? "text-red-500" : "text-muted-foreground"
                              }`}>
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {new Date(task.dueDate).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                {dateOverdue && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-red-100 text-[8px] font-extrabold uppercase text-red-700 ml-1">
                                    Overdue
                                  </span>
                                )}
                              </span>
                            )}
                            
                            {task.lead && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock className="h-3 w-3 shrink-0 text-amber-500" />
                                <span className="truncate">Lead: {task.lead.title}</span>
                              </span>
                            )}

                            {task.deal && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Briefcase className="h-3 w-3 shrink-0 text-blue-500" />
                                <span className="truncate">Deal: {task.deal.title}</span>
                              </span>
                            )}

                            {task.assignedTo && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-foreground/80 pt-0.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{task.assignedTo.name}</span>
                              </span>
                            )}
                          </div>

                          {/* Status transition arrows */}
                          <div className="flex justify-between items-center border-t border-border/40 pt-2 mt-1">
                            <button
                              onClick={() => handleMoveStatus(task.id, col.id, "prev")}
                              disabled={col.id === "TODO"}
                              className="p-1 rounded bg-muted hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition-all"
                              title="Move back"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Status</span>
                            <button
                              onClick={() => handleMoveStatus(task.id, col.id, "next")}
                              disabled={col.id === "DONE"}
                              className="p-1 rounded bg-muted hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition-all"
                              title="Move forward"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
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
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1">Add Follow-up Task</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Add a checklist item linked optionally to your sales records.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Saudi Lead to verify requirements"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Details about this follow-up..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Link to Lead</label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No Linked Lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Link to Deal</label>
                <select
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No Linked Deal</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Assignee Agent</label>
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
                disabled={createTaskMutation.isPending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {createTaskMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="h-4.5 w-4.5" /> Save Task Card
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
