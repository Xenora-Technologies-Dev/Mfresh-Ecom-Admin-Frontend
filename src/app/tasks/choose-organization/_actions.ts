"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { parsePortalRole } from "@/lib/auth/roles";

export type EnsureOrgResult =
  | { ok: true; organizationId: string; created: boolean }
  | { ok: false; error: string };

function isAdminInviteMeta(meta: Record<string, unknown> | null | undefined): boolean {
  return parsePortalRole(meta?.portalRole) === "admin";
}

/**
 * Creates or reuses a Clerk organization for the pending session user.
 * End-users often cannot create orgs from the client when Dashboard disables
 * user-created organizations — Backend API works with the secret key.
 */
export async function ensureUserOrganization(): Promise<EnsureOrgResult> {
  const { userId } = await auth({ treatPendingAsSignedOut: false });

  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress
      || user.emailAddresses[0]?.emailAddress
      || "";

    const memberships = await client.users.getOrganizationMembershipList({
      userId,
      limit: 10,
    });

    if (memberships.data.length > 0) {
      const organizationId = memberships.data[0].organization.id;
      await healAdminMetadata(client, userId, user.publicMetadata as Record<string, unknown>, email);
      return { ok: true, organizationId, created: false };
    }

    const label =
      (typeof user.publicMetadata.organizationName === "string" &&
        user.publicMetadata.organizationName) ||
      (email ? `${email.split("@")[0]} workspace` : "MFresh Operations");

    const org = await client.organizations.createOrganization({
      name: label.slice(0, 80) || "MFresh Operations",
      createdBy: userId,
      publicMetadata: {
        portalSeed: true,
      },
    });

    await healAdminMetadata(
      client,
      userId,
      user.publicMetadata as Record<string, unknown>,
      email,
    );

    return { ok: true, organizationId: org.id, created: true };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "errors" in err
        ? String(
            (err as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]
              ?.longMessage
              || (err as { errors?: Array<{ message?: string }> }).errors?.[0]?.message
              || "",
          )
        : err instanceof Error
          ? err.message
          : "";

    return {
      ok: false,
      error: message || "Could not create organization. Enable org creation or personal accounts in Clerk.",
    };
  }
}

async function healAdminMetadata(
  client: Awaited<ReturnType<typeof clerkClient>>,
  userId: string,
  publicMeta: Record<string, unknown>,
  email: string,
) {
  let role = parsePortalRole(publicMeta.portalRole);
  let changed = false;
  const next = { ...publicMeta };

  if (!role && email) {
    const [pending, accepted] = await Promise.all([
      client.invitations.getInvitationList({ query: email, status: "pending", limit: 20 }),
      client.invitations.getInvitationList({ query: email, status: "accepted", limit: 20 }),
    ]);
    const invite =
      pending.data.find((inv) => isAdminInviteMeta(inv.publicMetadata as Record<string, unknown>))
      || accepted.data.find((inv) => isAdminInviteMeta(inv.publicMetadata as Record<string, unknown>));
    if (invite) {
      role = "admin";
      next.portalRole = "admin";
      next.onboardingComplete = true;
      changed = true;
      if (invite.status === "pending") {
        try {
          await client.invitations.revokeInvitation(invite.id);
        } catch {
          // ignore
        }
      }
    }
  }

  if (role === "admin" && next.onboardingComplete !== true && next.onboardingComplete !== "true") {
    next.onboardingComplete = true;
    next.portalRole = "admin";
    changed = true;
  }

  if (changed) {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: next,
    });
  }
}
