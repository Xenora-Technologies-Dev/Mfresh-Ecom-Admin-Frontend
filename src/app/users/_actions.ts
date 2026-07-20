"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { parsePortalRole } from "@/lib/auth/roles";

export type PortalAdminUser = {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  status: "active";
};

export type PortalAdminInvitation = {
  id: string;
  email: string;
  createdAt: number;
  status: "pending" | "accepted" | "revoked" | "expired";
  url?: string;
};

export type ListAdminsResult =
  | { ok: true; admins: PortalAdminUser[]; invitations: PortalAdminInvitation[] }
  | { ok: false; error: string };

export type InviteAdminResult =
  | { ok: true; invitationId: string; email: string }
  | { ok: false; error: string };

export type RevokeInviteResult = { ok: true } | { ok: false; error: string };

async function requireOpsAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { ok: false, error: "You must be signed in." };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = parsePortalRole(user.publicMetadata.portalRole);

  if (role !== "admin") {
    return { ok: false, error: "Only operations admins can manage portal users." };
  }

  return { ok: true, userId };
}

function displayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  return email?.split("@")[0] || "Admin";
}

function isAdminMetadata(meta: Record<string, unknown> | null | undefined): boolean {
  return parsePortalRole(meta?.portalRole) === "admin";
}

async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:3007";
}

export async function listPortalAdmins(): Promise<ListAdminsResult> {
  const gate = await requireOpsAdmin();
  if (!gate.ok) return gate;

  try {
    const client = await clerkClient();

    const [usersRes, invitesRes] = await Promise.all([
      client.users.getUserList({ limit: 100, orderBy: "-created_at" }),
      client.invitations.getInvitationList({
        status: "pending",
        limit: 100,
        orderBy: "-created_at",
      }),
    ]);

    const admins: PortalAdminUser[] = usersRes.data
      .filter((u) => isAdminMetadata(u.publicMetadata as Record<string, unknown>))
      .map((u) => {
        const email = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress
          || u.emailAddresses[0]?.emailAddress
          || "";
        return {
          id: u.id,
          email,
          name: displayName(u.firstName, u.lastName, email),
          createdAt: u.createdAt,
          status: "active" as const,
        };
      });

    const invitations: PortalAdminInvitation[] = invitesRes.data
      .filter((inv) => isAdminMetadata(inv.publicMetadata as Record<string, unknown> | null))
      .map((inv) => ({
        id: inv.id,
        email: inv.emailAddress,
        createdAt: inv.createdAt,
        status: inv.status,
        url: inv.url,
      }));

    return { ok: true, admins, invitations };
  } catch {
    return { ok: false, error: "Could not load portal users. Try again." };
  }
}

export async function inviteAdmin(formData: FormData): Promise<InviteAdminResult> {
  const gate = await requireOpsAdmin();
  if (!gate.ok) return gate;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  // Dashboard invites are operations-only.
  if (role !== "admin") {
    return { ok: false, error: "Only the Admin role can be invited from this page." };
  }

  try {
    const client = await clerkClient();
    const origin = await appOrigin();

    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      notify: true,
      redirectUrl: `${origin}/accept-invite`,
      publicMetadata: {
        portalRole: "admin",
        onboardingComplete: true,
      },
    });

    return {
      ok: true,
      invitationId: invitation.id,
      email: invitation.emailAddress,
    };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "errors" in err
        ? String(
            (err as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0]
              ?.longMessage
              || (err as { errors?: Array<{ message?: string }> }).errors?.[0]?.message
              || "",
          )
        : "";

    if (message.toLowerCase().includes("already") || message.toLowerCase().includes("exist")) {
      return {
        ok: false,
        error: "That email already has an account or a pending invitation.",
      };
    }

    return {
      ok: false,
      error: message || "Could not send invitation. Try again.",
    };
  }
}

export async function revokeAdminInvitation(
  invitationId: string,
): Promise<RevokeInviteResult> {
  const gate = await requireOpsAdmin();
  if (!gate.ok) return gate;

  if (!invitationId) {
    return { ok: false, error: "Missing invitation id." };
  }

  try {
    const client = await clerkClient();
    await client.invitations.revokeInvitation(invitationId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not revoke invitation." };
  }
}
