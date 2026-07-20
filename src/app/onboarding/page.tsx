"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOrganizationList, useUser } from "@clerk/nextjs";
import { Building2, Phone, ArrowRight } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { CountrySelect } from "@/components/admin/country-select";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getDashboardPath, parsePortalRole, type SignupPortalRole } from "@/lib/auth/roles";
import { completeOnboarding } from "./_actions";

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { setActive, isLoaded: orgsLoaded } = useOrganizationList();

  const unsafe = (user?.unsafeMetadata ?? {}) as Record<string, unknown>;
  const publicMeta = (user?.publicMetadata ?? {}) as Record<string, unknown>;

  const initialRole =
    parsePortalRole(unsafe.portalRole) ||
    parsePortalRole(publicMeta.portalRole) ||
    "buyer";

  const [portalRole, setPortalRole] = useState<SignupPortalRole>(
    initialRole === "admin" ? "buyer" : (initialRole as SignupPortalRole),
  );
  const [organizationName, setOrganizationName] = useState(
    typeof unsafe.organizationName === "string" ? unsafe.organizationName : "",
  );
  const [country, setCountry] = useState(
    typeof unsafe.country === "string" ? unsafe.country : "",
  );
  const [whatsapp, setWhatsapp] = useState(
    typeof unsafe.whatsapp === "string" ? unsafe.whatsapp : "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  const alreadyComplete = publicMeta.onboardingComplete === true;
  const isAdminInvite =
    publicMeta.portalRole === "admin" || unsafe.portalRole === "admin";

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (alreadyComplete) {
      const role = parsePortalRole(publicMeta.portalRole) ?? "buyer";
      router.replace(getDashboardPath(role));
    }
  }, [alreadyComplete, isLoaded, isSignedIn, publicMeta.portalRole, router, user]);

  // Auto-finalize when signup already collected org details, or for invited admins.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !orgsLoaded || alreadyComplete) return;
    if (autoRunning || loading) return;

    const isAdmin =
      publicMeta.portalRole === "admin" || unsafe.portalRole === "admin";

    const hasPrefill =
      typeof unsafe.organizationName === "string" &&
      unsafe.organizationName.trim() &&
      typeof unsafe.country === "string" &&
      unsafe.country.trim() &&
      parsePortalRole(unsafe.portalRole);

    if (!isAdmin && !hasPrefill) return;

    const run = async () => {
      setAutoRunning(true);
      setLoading(true);
      const formData = new FormData();

      if (isAdmin) {
        formData.set("portalRole", "admin");
      } else {
        formData.set("organizationName", String(unsafe.organizationName));
        formData.set("country", String(unsafe.country));
        formData.set(
          "whatsapp",
          typeof unsafe.whatsapp === "string" ? unsafe.whatsapp : "",
        );
        formData.set("portalRole", String(unsafe.portalRole));
      }

      const res = await completeOnboarding(formData);
      if (!res.ok) {
        setError(res.error);
        setAutoRunning(false);
        setLoading(false);
        return;
      }

      await user.reload();
      if (res.organizationId && setActive) {
        await setActive({ organization: res.organizationId });
      }
      router.replace(getDashboardPath(res.portalRole));
    };

    void run();
  }, [
    alreadyComplete,
    autoRunning,
    isLoaded,
    isSignedIn,
    loading,
    orgsLoaded,
    publicMeta.portalRole,
    router,
    setActive,
    unsafe.country,
    unsafe.organizationName,
    unsafe.portalRole,
    unsafe.whatsapp,
    user,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("organizationName", organizationName.trim());
    formData.set("country", country.trim());
    formData.set("whatsapp", whatsapp.trim());
    formData.set("portalRole", portalRole);

    const res = await completeOnboarding(formData);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    await user.reload();
    if (res.organizationId && setActive) {
      await setActive({ organization: res.organizationId });
    }
    router.replace(getDashboardPath(res.portalRole));
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAdminInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Operations access</h1>
          <p className="mt-2 text-sm text-muted">Finishing your admin invitation…</p>
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="inline-block rounded-xl bg-white p-2 shadow-sm ring-1 ring-border">
              <Image src="/logo.png" alt="MFresh" width={120} height={40} className="h-8 w-auto" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Organization details</h2>
            <p className="mt-2 text-sm text-muted">
              Confirm your organization so we can open your{" "}
              {portalRole === "seller" ? "seller" : "buyer"} portal.
            </p>
          </div>

          {autoRunning ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted">Setting up your organization…</p>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="organizationName">Organization name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Country</Label>
                <CountrySelect value={country} onChange={setCountry} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">
                  WhatsApp number <span className="font-normal text-muted">(optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="pl-10"
                    placeholder="+971 50 000 0000"
                  />
                </div>
              </div>

              <div className="flex gap-2 text-xs text-muted">
                <button
                  type="button"
                  className={portalRole === "buyer" ? "font-semibold text-primary" : ""}
                  onClick={() => setPortalRole("buyer")}
                >
                  Buyer
                </button>
                <span>·</span>
                <button
                  type="button"
                  className={portalRole === "seller" ? "font-semibold text-primary" : ""}
                  onClick={() => setPortalRole("seller")}
                >
                  Seller
                </button>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Saving..." : "Open portal"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
