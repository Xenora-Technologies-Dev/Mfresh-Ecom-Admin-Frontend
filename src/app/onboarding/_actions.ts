"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { parsePortalRole, type SignupPortalRole } from "@/lib/auth/roles";

export type OnboardingResult =
  | { ok: true; organizationId: string; portalRole: SignupPortalRole | "admin" }
  | { ok: false; error: string };

function asString(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function completeOnboarding(
  formData: FormData,
): Promise<OnboardingResult> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return { ok: false, error: "You must be signed in to continue." };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const unsafe = user.unsafeMetadata as Record<string, unknown>;
  const publicMeta = user.publicMetadata as Record<string, unknown>;

  if (publicMeta.onboardingComplete === true || publicMeta.onboardingComplete === "true") {
    const existingRole = parsePortalRole(publicMeta.portalRole);
    return {
      ok: true,
      organizationId: "",
      portalRole: existingRole ?? "buyer",
    };
  }

  const organizationName =
    asString(formData.get("organizationName")) ||
    (typeof unsafe.organizationName === "string" ? unsafe.organizationName : "");
  const country =
    asString(formData.get("country")) ||
    (typeof unsafe.country === "string" ? unsafe.country : "");
  const whatsapp =
    asString(formData.get("whatsapp")) ||
    (typeof unsafe.whatsapp === "string" ? unsafe.whatsapp : "");

  const portalRole =
    parsePortalRole(asString(formData.get("portalRole"))) ||
    parsePortalRole(unsafe.portalRole) ||
    parsePortalRole(publicMeta.portalRole);

  if (!portalRole) {
    return {
      ok: false,
      error: "Select a portal role (Buyer or Seller) to continue.",
    };
  }

  // Admin accounts are invite-only and should already have metadata set.
  if (portalRole === "admin") {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...publicMeta,
        onboardingComplete: true,
        portalRole: "admin",
      },
    });
    return { ok: true, organizationId: "", portalRole: "admin" };
  }

  if (!organizationName) {
    return { ok: false, error: "Organization name is required." };
  }
  if (!country) {
    return { ok: false, error: "Country is required." };
  }

  try {
    const organization = await client.organizations.createOrganization({
      name: organizationName,
      createdBy: userId,
      publicMetadata: {
        country,
        whatsapp: whatsapp || "",
        portalRole,
      },
    });

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        portalRole,
        organizationName,
        country,
        whatsapp: whatsapp || "",
      },
      unsafeMetadata: {
        ...unsafe,
        organizationName,
        country,
        whatsapp,
        portalRole,
      },
    });

    return {
      ok: true,
      organizationId: organization.id,
      portalRole,
    };
  } catch {
    return {
      ok: false,
      error: "Could not finish organization setup. Please try again.",
    };
  }
}
