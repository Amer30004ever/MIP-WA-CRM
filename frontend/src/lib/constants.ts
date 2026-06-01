/** Base API URL - reads from env or defaults to localhost */
const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const API_BASE_URL = rawUrl.endsWith("/api/v1") ? rawUrl : `${rawUrl}/api/v1`;

export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  inbox: "/inbox",
  leads: "/leads",
  contacts: "/contacts",
  companies: "/companies",
  deals: "/deals",
  tasks: "/tasks",
  settings: "/settings",
  templates: "/templates",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
