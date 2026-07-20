"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { getDashboardPath, type PortalRole } from "@/lib/auth/roles";
import { usePortalUser } from "@/hooks/use-portal-user";
import { syncPortalAccess } from "@/lib/auth/sync-portal-access";

const PUBLIC_PATHS = ["/login", "/sign-up", "/accept-invite", "/tasks"];
const AUTH_SHELL_BYPASS = [
  "/login",
  "/sign-up",
  "/accept-invite",
  "/onboarding",
  "/tasks",
];

const ADMIN_ONLY_PREFIXES = [
  "/categories",
  "/sub-categories",
  "/suppliers",
  "/customers",
  "/users",
  "/banners",
  "/homepage-sections",
  "/countries",
  "/product-images",
  "/settings",
  "/backup",
  "/messages",
  "/theme",
  "/orders",
  "/products",
];

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

function isAdminRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
}

function canAccess(pathname: string, role: PortalRole): boolean {
  if (role === "admin") return true;
  // Buyers/sellers no longer use this portal for workspaces.
  if (pathname.startsWith("/buyer") || pathname.startsWith("/seller")) {
    return role === "buyer" || role === "seller";
  }
  if (isAdminRoute(pathname)) return false;
  return false;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();
  const { isLoaded: userLoaded, user } = usePortalUser();
  const attemptedSyncFor = useRef<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname.startsWith("/onboarding");
  const bypassShell = AUTH_SHELL_BYPASS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn && !isPublic) {
      router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [authLoaded, isPublic, isSignedIn, pathname, router]);

  useEffect(() => {
    if (!authLoaded || !clerkUserLoaded || !isSignedIn || !clerkUser) return;
    if (!userLoaded) return;

    if (user) {
      // Non-admins belong on the storefront workspaces.
      if (user.role === "buyer" || user.role === "seller") {
        if (typeof window !== "undefined") {
          window.location.href = getDashboardPath(user.role);
        }
        return;
      }

      if (isPublic || isOnboarding) {
        router.replace("/");
      } else if (!canAccess(pathname, user.role)) {
        router.replace("/");
      }
      return;
    }

    if (attemptedSyncFor.current === clerkUser.id) {
      if (!isOnboarding && !isPublic) {
        // Incomplete buyer/seller — send to storefront onboarding.
        if (typeof window !== "undefined") {
          window.location.href = `${STOREFRONT}/onboarding`;
        }
      } else if (isPublic) {
        if (typeof window !== "undefined") {
          window.location.href = `${STOREFRONT}/onboarding`;
        }
      }
      return;
    }

    attemptedSyncFor.current = clerkUser.id;
    setSyncing(true);

    void (async () => {
      const res = await syncPortalAccess();
      if (res.ok) {
        await clerkUser.reload();
        if (res.portalRole === "admin") {
          router.replace("/");
          return;
        }
        if (typeof window !== "undefined") {
          window.location.href = getDashboardPath(
            res.portalRole === "seller" ? "seller" : "buyer",
          );
        }
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = `${STOREFRONT}/onboarding`;
      }
      setSyncing(false);
    })();
  }, [
    authLoaded,
    clerkUser,
    clerkUserLoaded,
    isOnboarding,
    isPublic,
    isSignedIn,
    pathname,
    router,
    user,
    userLoaded,
  ]);

  if (!authLoaded) {
    if (isPublic || isOnboarding) return <>{children}</>;
    return <LoadingScreen />;
  }

  if (!isSignedIn && !isPublic) return <LoadingScreen />;

  if (isSignedIn && (!userLoaded || syncing)) return <LoadingScreen />;

  if (isSignedIn && (isPublic || (isOnboarding && !user && syncing))) {
    return <LoadingScreen />;
  }

  if (isSignedIn && isPublic) return <LoadingScreen />;

  if (isSignedIn && !user && !isOnboarding && !bypassShell) return <LoadingScreen />;

  // Buyer/seller signed into ops portal — redirect in flight.
  if (user && user.role !== "admin" && !isPublic) return <LoadingScreen />;

  return <>{children}</>;
}
