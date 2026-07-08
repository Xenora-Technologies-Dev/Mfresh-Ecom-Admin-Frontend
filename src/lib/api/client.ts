const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4005/api/v1";
export const API_BASE = API_URL.replace(/\/api\/v1\/?$/, "");
export const STORAGE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL?.replace(/\/$/, "") ?? "";

export function storageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (STORAGE_PUBLIC_URL) {
    const normalized = path.replace(/^\/storage\//, "").replace(/^\//, "");
    return `${STORAGE_PUBLIC_URL}/${normalized}`;
  }
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | undefined;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      message = await res.text().catch(() => message);
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type");
  if (ct?.includes("text/csv")) return (await res.text()) as T;
  return res.json() as Promise<T>;
}

export function qs(params: ListParams = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function uploadImage(
  file: File,
  type: "MAIN" | "SUB" | "DISPLAY",
  preview = true,
) {
  const form = new FormData();
  form.append("file", file);
  const endpoint = preview
    ? `/images/preview?type=${type}`
    : `/images/upload?type=${type}`;
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
}

export async function uploadCategoryImage(file: File, categoryId?: string) {
  const form = new FormData();
  form.append("file", file);
  const q = categoryId ? `?categoryId=${categoryId}` : "";
  const res = await fetch(`${API_URL}/images/category${q}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json() as Promise<{ path: string; url: string }>;
}

export async function deleteImage(id: string) {
  const res = await fetch(`${API_URL}/images/${id}`, { method: "DELETE" });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
}

export const STORAGE_URL = STORAGE_PUBLIC_URL || `${API_BASE}/storage`;
