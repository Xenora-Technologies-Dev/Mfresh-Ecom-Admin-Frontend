"use client";

import { useMemo } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { parsePortalRole, type PortalUser } from "@/lib/auth/roles";
import { clearMessagesSectionSeen } from "@/lib/messages";

function displayName(
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null,
  email?: string | null,
): string {
  if (fullName?.trim()) return fullName.trim();
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  return email?.split("@")[0] || "User";
}

function isOnboardingComplete(value: unknown): boolean {
  return value === true || value === "true";
}

export function usePortalUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const portalUser: PortalUser | null = useMemo(() => {
    if (!isSignedIn || !user) return null;

    const meta = user.publicMetadata as Record<string, unknown>;
    if (!isOnboardingComplete(meta.onboardingComplete)) return null;

    const role = parsePortalRole(meta.portalRole);
    if (!role) return null;

    return {
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: displayName(
        user.firstName,
        user.lastName,
        user.fullName,
        user.primaryEmailAddress?.emailAddress,
      ),
      role,
      company:
        typeof meta.organizationName === "string"
          ? meta.organizationName
          : undefined,
      country: typeof meta.country === "string" ? meta.country : undefined,
      whatsapp: typeof meta.whatsapp === "string" ? meta.whatsapp : undefined,
    };
  }, [isSignedIn, user]);

  const logout = async () => {
    clearMessagesSectionSeen();
    await signOut({ redirectUrl: "/login" });
  };

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    user: portalUser,
    logout,
  };
}
