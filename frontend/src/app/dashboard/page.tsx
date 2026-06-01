"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import api from "@/lib/api";
import {
  MessageSquare,
  TrendingUp,
  DollarSign,
  CheckSquare,
  Loader2,
  Clock,
  ArrowUpRight,
  User,
  Briefcase,
} from "lucide-react";

interface RecentConversation {
  id: string;
  status: string;
  lastMessageAt: string;
  contact: {
    id: string;
    name: string | null;
    phone: string;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
}

interface AgentPerf {
  agentId: string;
  name: string;
  assignedCount: number;
}

interface DashboardStats {
  openConversations: number;
  newLeads: number;
  openDeals: number;
  pipelineValue: number;
  overdueTasks: number;
  recentConversations: RecentConversation[];
  pipelineDistribution: PipelineStage[];
  agentPerformance: AgentPerf[];
}

export default function DashboardPage() {
  // Query
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<DashboardStats>("/dashboard/stats");
      return res.data;
    },
  });

  const cards = [
    {
      label: "Open Chats",
      value: stats ? stats.openConversations.toString() : "—",
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Active Opportunities",
      value: stats ? stats.newLeads.toString() : "—",
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Pipeline Volume",
      value: stats ? `$${stats.pipelineValue.toLocaleString()}` : "—",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Overdue Alerts",
      value: stats ? stats.overdueTasks.toString() : "—",
      icon: CheckSquare,
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="CRM Analytics"
        description="Comprehensive dashboard tracking conversation volume, team performance, and sales pipeline metrics"
      />

      {isLoadingStats ? (
        <div className="flex h-96 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground font-semibold">Aggregating live CRM metrics…</span>
        </div>
      ) : (
        <>
          {/* STATS HIGHLIGHT GRID */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground font-sans">{value}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 border ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TWO COLUMN METRIC ANALYSIS */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            
            {/* COLUMN 1: RECENT ACTIVE CHATS */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Recent Live Conversations
                  </h3>
                  <Link
                    href="/inbox"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Open Inbox <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                {!stats || stats.recentConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageSquare className="h-6 w-6 opacity-30 mb-1" />
                    <span className="text-xs uppercase tracking-wider opacity-60">No Live Chats</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {stats.recentConversations.map((chat) => (
                      <div
                        key={chat.id}
                        className="rounded-xl border border-border/60 bg-muted/10 p-3.5 hover:bg-muted/30 transition-all flex items-center justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <h5 className="font-semibold text-sm text-foreground">
                            {chat.contact.name || chat.contact.phone}
                          </h5>
                          <span className="text-3xs font-semibold text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(chat.lastMessageAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {chat.assignedTo && (
                            <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                              {chat.assignedTo.name}
                            </span>
                          )}
                          <Link
                            href="/inbox"
                            className="p-1.5 rounded-lg bg-background hover:bg-primary hover:text-white transition-all text-muted-foreground"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: SALES KANBAN PIPELINE VALUE & TEAM OVERVIEW */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6">
              
              {/* Pipeline Overview */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-emerald-500" />
                    Deal Pipeline Volume
                  </h3>
                  <Link
                    href="/deals"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    View Board <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                {!stats || stats.pipelineDistribution.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Briefcase className="h-6 w-6 opacity-30 mb-1" />
                    <span className="text-xs uppercase tracking-wider opacity-60">No Deals Logged</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {stats.pipelineDistribution.map((stage) => {
                      const maxValue = Math.max(...stats.pipelineDistribution.map((s) => s.value), 1);
                      const percent = Math.min((stage.value / maxValue) * 100, 100);

                      return (
                        <div key={stage.stage} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-muted-foreground uppercase tracking-wider text-3xs">
                              {stage.stage} ({stage.count})
                            </span>
                            <span className="text-foreground font-mono">${stage.value.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              style={{ width: `${percent}%` }}
                              className="h-full bg-primary rounded-full transition-all"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Agent Performance overview */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4 text-purple-500" />
                    Teammate Conversations Leaderboard
                  </h3>
                </div>

                {!stats || stats.agentPerformance.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No agent assignments.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stats.agentPerformance.map((perf) => (
                      <div
                        key={perf.agentId}
                        className="rounded-xl border border-border/60 bg-muted/10 p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                            {perf.name.substring(0, 1).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-foreground">{perf.name}</span>
                        </div>
                        <span className="text-xs font-extrabold text-foreground px-2 py-0.5 rounded-lg bg-background border border-border">
                          {perf.assignedCount} chats
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </>
      )}
    </AppLayout>
  );
}
