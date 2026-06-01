"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import api from "@/lib/api";
import {
  Settings,
  User,
  Users,
  Bell,
  CreditCard,
  Phone,
  Link2,
  Copy,
  Check,
  Loader2,
  UserPlus,
  Mail,
  Shield,
  Save,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"whatsapp" | "account" | "team" | "notifications" | "billing">("whatsapp");
  
  // WhatsApp config state
  const [phoneId, setPhoneId] = useState("102938475610293");
  const [bizId, setBizId] = useState("987654321098765");
  const [verifyToken, setVerifyToken] = useState("mavoid_whatsapp_verify_token_2026");
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

  // Queries
  const { data: profile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get<UserProfile>("/auth/me");
      return res.data;
    },
  });

  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["team-users"],
    queryFn: async () => {
      const res = await api.get<TeamMember[]>("/auth/users");
      return res.data || [];
    },
    enabled: activeTab === "team",
  });

  const handleCopyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin.replace("3000", "4000")}/api/v1/webhook/ingest`;
    navigator.clipboard.writeText(webhookUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWhatsapp(true);
    setTimeout(() => {
      setIsSavingWhatsapp(false);
      alert("WhatsApp Business API webhook configuration saved successfully!");
    }, 1000);
  };

  const getTabClass = (tab: typeof activeTab) => {
    return `w-full rounded-xl px-4 py-3 text-left text-sm font-semibold flex items-center gap-2.5 transition-all ${
      activeTab === tab
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
        : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
    }`;
  };

  return (
    <AppLayout>
      <PageHeader
        title="Workspace Settings"
        description="Manage WhatsApp API bindings, profile details, team accounts, and preferences"
      />

      <div className="grid gap-6 lg:grid-cols-4">
        
        {/* Sidebar Nav */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm h-fit">
          <nav className="space-y-1.5">
            <button onClick={() => setActiveTab("whatsapp")} className={getTabClass("whatsapp")}>
              <Phone className="h-4.5 w-4.5" /> WhatsApp API
            </button>
            <button onClick={() => setActiveTab("account")} className={getTabClass("account")}>
              <User className="h-4.5 w-4.5" /> My Account
            </button>
            <button onClick={() => setActiveTab("team")} className={getTabClass("team")}>
              <Users className="h-4.5 w-4.5" /> Team Management
            </button>
            <button onClick={() => setActiveTab("notifications")} className={getTabClass("notifications")}>
              <Bell className="h-4.5 w-4.5" /> Notifications
            </button>
            <button onClick={() => setActiveTab("billing")} className={getTabClass("billing")}>
              <CreditCard className="h-4.5 w-4.5" /> Billing & Plan
            </button>
          </nav>
        </div>

        {/* Settings Panel Area */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          
          {/* TAB 1: WHATSAPP CONFIG */}
          {activeTab === "whatsapp" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">WhatsApp Cloud API Configuration</h3>
                <p className="text-xs text-muted-foreground">
                  Connect your official Meta WhatsApp Business account credentials.
                </p>
              </div>

              {/* Webhook Ingestion card */}
              <div className="rounded-2xl bg-muted/20 border border-border/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-primary" /> Webhook Ingest URL
                  </h4>
                  <p className="text-2xs text-muted-foreground max-w-md leading-relaxed">
                    Provide this secure callback URL inside your Meta Developer Console for the WhatsApp Product.
                  </p>
                  <code className="block bg-background text-3xs font-mono border border-border/40 px-3 py-2 rounded-xl text-primary mt-2 break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin.replace("3000", "4000")}/api/v1/webhook/ingest`
                      : "https://your-crm-server.com/api/v1/webhook/ingest"}
                  </code>
                </div>
                <button
                  onClick={handleCopyWebhookUrl}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted flex items-center gap-1.5 shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-muted-foreground" /> Copy URL
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleSaveWhatsapp} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Phone Number ID</label>
                    <input
                      type="text"
                      required
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      placeholder="e.g. 102938475610293"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Business Account ID</label>
                    <input
                      type="text"
                      required
                      value={bizId}
                      onChange={(e) => setBizId(e.target.value)}
                      placeholder="e.g. 987654321098765"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Webhook Verify Token</label>
                  <input
                    type="text"
                    required
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="Enter verify token defined in Meta Developers console"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingWhatsapp}
                    className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingWhatsapp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Credentials
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MY ACCOUNT PROFILE */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">My Profile Account</h3>
                <p className="text-xs text-muted-foreground">
                  View and verify your registered agent profile parameters.
                </p>
              </div>

              {isLoadingProfile ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !profile ? (
                <p className="text-xs text-muted-foreground">Failed to load user profile.</p>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4.5 rounded-2xl bg-muted/20 border border-border/80">
                    <div className="h-12 w-12 rounded-full bg-primary/15 text-primary text-lg font-bold border border-primary/25 flex items-center justify-center">
                      {profile.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{profile.name}</h4>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    <div className="space-y-1 border border-border/60 rounded-xl p-3.5">
                      <span className="text-3xs uppercase font-extrabold text-muted-foreground tracking-widest block">System Role</span>
                      <span className="text-xs font-bold text-foreground flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        {profile.role}
                      </span>
                    </div>

                    <div className="space-y-1 border border-border/60 rounded-xl p-3.5">
                      <span className="text-3xs uppercase font-extrabold text-muted-foreground tracking-widest block">Account Status</span>
                      <span className="text-xs font-bold text-emerald-600">Active Workspace</span>
                    </div>

                    <div className="space-y-1 border border-border/60 rounded-xl p-3.5 col-span-2">
                      <span className="text-3xs uppercase font-extrabold text-muted-foreground tracking-widest block">Date Joined</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {new Date(profile.createdAt).toLocaleDateString([], {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM MEMBERS */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">Team Representatives</h3>
                  <p className="text-xs text-muted-foreground">
                    A list of all team members with system access permissions.
                  </p>
                </div>
                <button
                  onClick={() => alert("Registration of new agents is available via standard Auth Register endpoints.")}
                  className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" /> Invite Representative
                </button>
              </div>

              {isLoadingTeam ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No teammates registered.</p>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-border/60 bg-muted/10 p-3.5 flex items-center justify-between hover:bg-muted/20 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-extrabold flex items-center justify-center">
                          {member.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{member.name}</span>
                          <span className="text-3xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" /> {member.email}
                          </span>
                        </div>
                      </div>

                      <span className="text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-background border border-border/80 text-muted-foreground uppercase tracking-widest">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">Notification Preferences</h3>
                <p className="text-xs text-muted-foreground">
                  Configure alerts and notification updates.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { title: "Incoming Message Alerts", desc: "Show push alerts on receiving a WhatsApp Webhook message" },
                  { title: "Deal Status Transitions", desc: "Alert when deals are progressed, Won, or Lost" },
                  { title: "Overdue Tasks Warnings", desc: "Daily reminders for tasks past their scheduled deadlines" },
                ].map((notif, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-3.5 border border-border/50 rounded-xl bg-muted/10"
                  >
                    <div className="space-y-0.5 max-w-sm">
                      <h5 className="text-xs font-bold text-foreground">{notif.title}</h5>
                      <p className="text-2xs text-muted-foreground leading-relaxed">{notif.desc}</p>
                    </div>
                    {/* Toggle button mockup */}
                    <div className="h-5.5 w-10 bg-primary rounded-full relative p-0.5 cursor-pointer flex items-center">
                      <div className="h-4.5 w-4.5 rounded-full bg-background shadow-md transform translate-x-4.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BILLING */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">Subscription Billing</h3>
                <p className="text-xs text-muted-foreground">
                  Workspace pricing tiers, API quotas, and billing status.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-3xs font-extrabold uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full tracking-wider">
                    Enterprise Workspace Plan
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-2">Unlimited Agent Seating</h4>
                  <p className="text-2xs text-muted-foreground max-w-xs leading-relaxed">
                    Access all advanced modules, webhook routing, WhatsApp CRM logs, and pipeline visualizers.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground block">Workspace Tier</span>
                  <span className="text-xl font-bold text-foreground font-mono">Standard Team</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </AppLayout>
  );
}
