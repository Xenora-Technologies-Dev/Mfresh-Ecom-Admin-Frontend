/**
 * Shared portal auth types and helpers.
 * Session state comes from Clerk — use `usePortalUser()` in client components.
 */
export {
  getDashboardPath,
  type PortalRole,
  type PortalUser,
  type SignupPortalRole,
} from "@/lib/auth/roles";
