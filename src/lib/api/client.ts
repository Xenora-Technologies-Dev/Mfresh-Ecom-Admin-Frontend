const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const API_BASE = API_URL.replace(/\/api\/v1\/?$/, "");
export const STORAGE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL?.replace(/\/$/, "") ?? "";

if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error("NEXT_PUBLIC_API_URL must be set in production");
}

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

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

export function setApiTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

async function authHeaders(
  extra?: HeadersInit,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...(extra as Record<string, string> | undefined),
  };
  if (typeof window !== "undefined" && tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      /* ignore */
    }
  }
  return headers;
}

export async function api<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  if (!API_URL) throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 500);
  const headers = await authHeaders({
    "Content-Type": "application/json",
    ...options?.headers,
  });
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
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
  type: "DISPLAY" | "ADDITIONAL",
  preview = true,
) {
  if (!API_URL) throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 500);
  const form = new FormData();
  form.append("file", file);
  const endpoint = preview
    ? `/images/preview?type=${type}`
    : `/images/upload?type=${type}`;
  const headers = await authHeaders();
  delete headers["Content-Type"];
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    body: form,
    headers,
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
  return res.json();
}

export async function uploadCategoryImage(file: File, categoryId?: string) {
  if (!API_URL) throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 500);
  const form = new FormData();
  form.append("file", file);
  const q = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  const headers = await authHeaders();
  delete headers["Content-Type"];
  const res = await fetch(`${API_URL}/images/category${q}`, {
    method: "POST",
    body: form,
    headers,
  });
  if (!res.ok) throw new ApiError(res.statusText, res.status);
  return res.json() as Promise<{ path: string; url: string }>;
}

export async function uploadBannerImage(file: File, bannerId?: string) {
  if (!API_URL) throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 500);
  const form = new FormData();
  form.append("file", file);
  const q = bannerId ? `?bannerId=${encodeURIComponent(bannerId)}` : "";
  const headers = await authHeaders();
  delete headers["Content-Type"];
  const res = await fetch(`${API_URL}/images/banner${q}`, {
    method: "POST",
    body: form,
    headers,
  });
  if (!res.ok) throw new ApiError(res.statusText, res.status);
  return res.json() as Promise<{ path: string; url: string }>;
}

export async function deleteImage(id: string) {
  if (!API_URL) throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 500);
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/images/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new ApiError(res.statusText, res.status);
}
