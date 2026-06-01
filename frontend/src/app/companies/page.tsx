"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";
import {
  Building2,
  Plus,
  Search,
  Globe,
  Tag,
  Users,
  Briefcase,
  Loader2,
  X,
  PlusCircle,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  createdAt: string;
  _count?: {
    contacts: number;
    deals: number;
  };
}

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");

  // Queries
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await api.get<{ data: Company[] } | Company[]>("/companies");
      return Array.isArray(res.data) ? res.data : (res.data as any).data || [];
    },
  });

  // Mutation: Create Company
  const createCompanyMutation = useMutation({
    mutationFn: async (payload: { name: string; domain?: string; industry?: string }) => {
      return api.post("/companies", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to register company. Please check the backend connection.");
    },
  });

  const resetForm = () => {
    setName("");
    setDomain("");
    setIndustry("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCompanyMutation.mutate({
      name: name.trim(),
      domain: domain.trim() || undefined,
      industry: industry.trim() || undefined,
    });
  };

  // Filter companies
  const filteredCompanies = companies.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <AppLayout>
      <PageHeader
        title="B2B Companies"
        description="Catalog business accounts and track contacts and pipeline deals per enterprise"
        action={
          <button
            id="companies-create"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            New Company
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
              id="companies-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies by name, domain, industry…"
              className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoadingCompanies ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading accounts…</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-primary" />}
            title={searchQuery ? "No matching accounts found" : "No B2B accounts yet"}
            description={
              searchQuery
                ? "Try adjusting your search query."
                : "Register a B2B enterprise company to structure your corporate leads and deals."
            }
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Register Company
              </button>
            }
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Company Account</th>
                  <th className="px-6 py-4">Industry Domain</th>
                  <th className="px-6 py-4">Domain Website</th>
                  <th className="px-6 py-4 text-center">Contacts Count</th>
                  <th className="px-6 py-4 text-center">Active Deals</th>
                  <th className="px-6 py-4 font-normal text-muted-foreground">Date Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {company.industry ? (
                        <span className="flex items-center gap-1.5 text-xs bg-muted border border-border px-2 py-0.5 rounded-lg">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground/80" />
                          {company.industry}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {company.domain ? (
                        <a
                          href={`https://${company.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-blue-500 font-semibold text-xs hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          {company.domain}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-foreground font-bold">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500">
                        <Users className="h-3.5 w-3.5" />
                        {company._count?.contacts ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-foreground font-bold">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                        <Briefcase className="h-3.5 w-3.5" />
                        {company._count?.deals ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(company.createdAt).toLocaleDateString([], {
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

            <h3 className="text-lg font-bold text-foreground mb-1">Register B2B Company</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Add corporate organizational details to catalog a company profile.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aramco Digital"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Domain Website</label>
                <input
                  type="text"
                  placeholder="e.g. aramco.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Industry Vertical</label>
                <input
                  type="text"
                  placeholder="e.g. Petroleum & Oil, Software Technology"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={createCompanyMutation.isPending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {createCompanyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="h-4.5 w-4.5" /> Save Company Account
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
