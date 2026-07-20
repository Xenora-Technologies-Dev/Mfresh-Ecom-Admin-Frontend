"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { parsePortalRole, type PortalRole } from "@/lib/auth/roles";

export type SyncPortalAccessResult =
  | { ok: true; portalRole: PortalRole; changed: boolean }
  | { ok: false; error: string; needsOnboarding?: boolean };

function isCompleteFlag(value: unknown): boolean {
  return value === true || value === "true";
}

function isAdminInviteMeta(meta: Record<string, unknown> | null | undefined): boolean {
  return parsePortalRole(meta?.portalRole) === "admin";
}

/**
 * Ensures invited ops admins get portal metadata even if Clerk didn't transfer
 * invitation publicMetadata (e.g. signup without the ticket link).
 * Also finalizes admin onboarding when portalRole is already admin.
 */
export async function syncPortalAccess(): Promise<SyncPortalAccessResult> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { ok: false, error: "Not signed in." };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const publicMeta = { ...(user.publicMetadata as Record<string, unknown>) };
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress
      || user.emailAddresses[0]?.emailAddress
      || "";

    let role = parsePortalRole(publicMeta.portalRole);
    let changed = false;

    // Heal: invited admin email without role metadata yet.
    if (!role && email) {
      const [pending, accepted] = await Promise.all([
        client.invitations.getInvitationList({
          query: email,
          status: "pending",
          limit: 20,
        }),
        client.invitations.getInvitationList({
          query: email,
          status: "accepted",
          limit: 20,
        }),
      ]);

      const adminInvite =
        pending.data.find((inv) => isAdminInviteMeta(inv.publicMetadata as Record<string, unknown>))
        || accepted.data.find((inv) =>
          isAdminInviteMeta(inv.publicMetadata as Record<string, unknown>),
        );

      if (adminInvite) {
        role = "admin";
        publicMeta.portalRole = "admin";
        publicMeta.onboardingComplete = true;
        changed = true;

        // Consume leftover pending invite so it can't be reused.
        if (adminInvite.status === "pending") {
          try {
            await client.invitations.revokeInvitation(adminInvite.id);
          } catch {
            // Non-fatal — metadata still applied.
          }
        }
      }
    }

    // Admin invite metadata present but onboarding flag missing/incorrect.
    if (role === "admin" && !isCompleteFlag(publicMeta.onboardingComplete)) {
      publicMeta.onboardingComplete = true;
      changed = true;
    }

    if (changed) {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...publicMeta,
          portalRole: role ?? publicMeta.portalRole,
          onboardingComplete: true,
        },
      });
    }

    role = parsePortalRole(publicMeta.portalRole) ?? role;

    if (role && isCompleteFlag(publicMeta.onboardingComplete)) {
      return { ok: true, portalRole: role, changed };
    }

    return {
      ok: false,
      error: "Onboarding required.",
      needsOnboarding: true,
    };
  } catch {
    return { ok: false, error: "Could not sync portal access." };
  }
}
