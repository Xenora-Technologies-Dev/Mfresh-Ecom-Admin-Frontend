import { api, type ListParams, type PaginatedResponse, qs } from "./client";

export const dashboardApi = {
  stats: () =>
    api<{
      counts: Record<string, number>;
      recentProducts: Record<string, unknown>[];
    }>("/dashboard/stats"),
};

export const categoriesApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/categories${qs(p)}`),
  get: (id: string) => api<Record<string, unknown>>(`/categories/${id}`),
  create: (data: Record<string, unknown>) =>
    api("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/categories/${id}`, { method: "DELETE" }),
  export: (p: ListParams) =>
    api<string>(`/categories/export${qs(p)}`),
};

export const subCategoriesApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/sub-categories${qs(p)}`),
  create: (data: Record<string, unknown>) =>
    api("/sub-categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/sub-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/sub-categories/${id}`, { method: "DELETE" }),
  export: (p: ListParams) => api<string>(`/sub-categories/export${qs(p)}`),
};

export const productsApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/products${qs(p)}`),
  get: (id: string) => api<Record<string, unknown>>(`/products/${id}`),
  create: (data: Record<string, unknown>) =>
    api("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/products/${id}`, { method: "DELETE" }),
  export: (p: ListParams) => api<string>(`/products/export${qs(p)}`),
};

export const suppliersApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/suppliers${qs(p)}`),
  create: (data: Record<string, unknown>) =>
    api("/suppliers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/suppliers/${id}`, { method: "DELETE" }),
  export: (p: ListParams) => api<string>(`/suppliers/export${qs(p)}`),
};

export const customersApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/customers${qs(p)}`),
  create: (data: Record<string, unknown>) =>
    api("/customers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/customers/${id}`, { method: "DELETE" }),
  export: (p: ListParams) => api<string>(`/customers/export${qs(p)}`),
};

export const bannersApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/banners${qs(p)}`),
  create: (data: Record<string, unknown>) =>
    api("/banners", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/banners/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  toggle: (id: string, isEnabled: boolean) =>
    api(`/banners/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ isEnabled }),
    }),
  remove: (id: string) => api(`/banners/${id}`, { method: "DELETE" }),
  export: (p: ListParams) => api<string>(`/banners/export${qs(p)}`),
};

export const homepageSectionsApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/homepage-sections${qs(p)}`),
  create: (data: Record<string, unknown>) =>
    api("/homepage-sections", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/homepage-sections/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  toggle: (id: string, isEnabled: boolean) =>
    api(`/homepage-sections/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ isEnabled }),
    }),
  remove: (id: string) => api(`/homepage-sections/${id}`, { method: "DELETE" }),
  export: (p: ListParams) => api<string>(`/homepage-sections/export${qs(p)}`),
};

export const countriesApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/countries${qs(p)}`),
  create: (data: Record<string, unknown>) =>
    api("/countries", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/countries/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/countries/${id}`, { method: "DELETE" }),
  export: (p: ListParams) => api<string>(`/countries/export${qs(p)}`),
};

export const productImagesApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/product-images${qs(p)}`),
  export: (p: ListParams) => api<string>(`/product-images/export${qs(p)}`),
};

export const settingsApi = {
  list: () => api<Record<string, unknown>[]>("/settings"),
  upsert: (key: string, value: unknown) =>
    api(`/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
  bulk: (settings: { key: string; value: unknown }[]) =>
    api("/settings/bulk", {
      method: "PUT",
      body: JSON.stringify({ settings }),
    }),
};

export const leadsApi = {
  list: (p: ListParams) =>
    api<PaginatedResponse<Record<string, unknown>>>(`/leads${qs(p)}`),
  get: (id: string) => api<Record<string, unknown>>(`/leads/${id}`),
  unreadCount: (since?: string) =>
    api<{ count: number }>(
      `/leads/unread-count${since ? qs({ since }) : ""}`,
    ),
  markRead: (id: string, isRead = true) =>
    api<Record<string, unknown>>(`/leads/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify({ isRead }),
    }),
  markAllRead: () =>
    api<{ updated: number }>("/leads/read-all", { method: "PATCH" }),
  remove: (id: string) => api(`/leads/${id}`, { method: "DELETE" }),
};

export const backupApi = {
  list: () => api<{ filename: string; createdAt: string }[]>("/backup"),
  create: () => api("/backup/create", { method: "POST" }),
  restore: (filename: string) =>
    api("/backup/restore", {
      method: "POST",
      body: JSON.stringify({ filename }),
    }),
};
