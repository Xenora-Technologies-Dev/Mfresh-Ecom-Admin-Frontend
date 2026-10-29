import { STOREFRONT_URL } from "@/lib/site-urls";
export type PortalRole = "admin" | "buyer" | "seller";

export type SignupPortalRole = Exclude<PortalRole, "admin">;

export interface PortalUser {
  email: string;
  name: string;
  role: PortalRole;
  company?: string;
  country?: string;
  whatsapp?: string;
}

const STOREFRONT = STOREFRONT_URL;

export function getDashboardPath(role: PortalRole): string {
  switch (role) {
    case "buyer":
      return `${STOREFRONT}/buyer`;
    case "seller":
      return `${STOREFRONT}/seller`;
    default:
      return "/";
  }
}

export function parsePortalRole(value: unknown): PortalRole | null {
  if (value === "admin" || value === "buyer" || value === "seller") return value;
  return null;
}

/** Operations feature flags — all roles currently behave as admin for ops. */
export function hasOperationsAccess(role: PortalRole | null | undefined): boolean {
  return role === "admin";
}
