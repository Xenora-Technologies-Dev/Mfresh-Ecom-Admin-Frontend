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

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

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
