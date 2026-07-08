"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDashboardPath, useAuthStore, type PortalRole } from "@/store/auth-store";

const PUBLIC_PATHS = ["/login"];

const ADMIN_ONLY_PREFIXES = [
  "/categories",
  "/sub-categories",
  "/suppliers",
  "/customers",
  "/banners",
  "/homepage-sections",
  "/countries",
  "/product-images",
  "/settings",
  "/backup",
];

function isAdminRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
}

function isSellerRoute(pathname: string): boolean {
  return pathname.startsWith("/seller") || pathname.startsWith("/products");
}

function isBuyerRoute(pathname: string): boolean {
  return pathname.startsWith("/buyer");
}

function canAccess(pathname: string, role: PortalRole): boolean {
  if (isAdminRoute(pathname)) return role === "admin";
  if (isSellerRoute(pathname)) return role === "admin" || role === "seller";
  if (isBuyerRoute(pathname)) return role === "buyer";
  return true;
}

export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && pathname === "/login") {
      router.replace(getDashboardPath(user.role));
      return;
    }
    if (user && !isPublic && !canAccess(pathname, user.role)) {
      router.replace(getDashboardPath(user.role));
    }
  }, [user, isPublic, pathname, router]);

  if (!user && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user && pathname === "/login") {
    return null;
  }

  return <>{children}</>;
}
