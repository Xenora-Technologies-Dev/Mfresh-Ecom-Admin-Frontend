import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearMessagesSectionSeen } from "@/lib/messages";

export type PortalRole = "admin" | "buyer" | "seller";

export interface PortalUser {
  email: string;
  name: string;
  role: PortalRole;
  company?: string;
}

interface AuthState {
  user: PortalUser | null;
  login: (user: PortalUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => {
        clearMessagesSectionSeen();
        set({ user });
      },
      logout: () => {
        clearMessagesSectionSeen();
        set({ user: null });
      },
    }),
    { name: "mfresh-portal-auth" },
  ),
);

export function getDashboardPath(role: PortalRole): string {
  switch (role) {
    case "buyer":
      return "/buyer";
    case "seller":
      return "/seller";
    default:
      return "/";
  }
}
