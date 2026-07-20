"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Layers,
  Package,
  Truck,
  Users,
  ImageIcon,
  Globe,
  Settings,
  Database,
  PanelTop,
  Home,
  ChevronLeft,
  Menu,
  ShoppingBag,
  LogOut,
  Store,
  BarChart3,
  Palette,
  Mail,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { PortalRole } from "@/lib/auth/roles";
import { usePortalUser } from "@/hooks/use-portal-user";
import { leadsApi } from "@/lib/api";
import { getMessagesSeenAt } from "@/lib/messages";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: PortalRole[];
  badge?: "messages";
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/orders", label: "Orders", icon: ClipboardList, roles: ["admin"] },
  { href: "/categories", label: "Categories", icon: FolderTree, roles: ["admin"] },
  { href: "/sub-categories", label: "Sub Categories", icon: Layers, roles: ["admin"] },
  { href: "/products", label: "Products", icon: Package, roles: ["admin"] },
  {
    href: "/messages",
    label: "Messages",
    icon: Mail,
    roles: ["admin"],
    badge: "messages",
  },
  { href: "/suppliers", label: "Suppliers", icon: Truck, roles: ["admin"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["admin"] },
  { href: "/users", label: "Users", icon: UserPlus, roles: ["admin"] },
  { href: "/banners", label: "Banner Management", icon: PanelTop, roles: ["admin"] },
  { href: "/homepage-sections", label: "Homepage Sections", icon: Home, roles: ["admin"] },
  { href: "/countries", label: "Countries", icon: Globe, roles: ["admin"] },
  { href: "/product-images", label: "Product Images", icon: ImageIcon, roles: ["admin"] },
  { href: "/theme", label: "Theme & Branding", icon: Palette, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { href: "/backup", label: "Backup & Restore", icon: Database, roles: ["admin"] },
];

const roleLabels: Record<PortalRole, string> = {
  admin: "Operations",
  buyer: "Buyer",
  seller: "Seller",
};

const roleBadgeColors: Record<PortalRole, string> = {
  admin: "bg-violet-500/20 text-violet-200",
  buyer: "bg-sky-500/20 text-sky-200",
  seller: "bg-emerald-500/20 text-emerald-200",
};

function PortalSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const { user, logout } = usePortalUser();

  useEffect(() => {
    setSeenAt(getMessagesSeenAt());
  }, [pathname]);

  const { data: unreadData } = useQuery({
    queryKey: ["messages-unread", seenAt],
    queryFn: () => leadsApi.unreadCount(seenAt ?? undefined),
    enabled: user?.role === "admin",
    refetchInterval: 30_000,
  });

  const unreadBadge = unreadData?.count ?? 0;

  if (!user) return null;

  const nav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-lg bg-sidebar p-2 text-white lg:hidden"
        onClick={() => setOpen(!open)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="rounded-lg bg-white p-1.5">
            <Image src="/logo.png" alt="MFresh" width={100} height={32} className="h-8 w-auto" />
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
            MFresh Portal
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                roleBadgeColors[user.role],
              )}
            >
              {roleLabels[user.role]}
            </span>
          </div>
          <p className="mt-2 truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-white/50">{user.email}</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const showMessagesBadge =
              item.badge === "messages" &&
              unreadBadge > 0 &&
              !pathname.startsWith("/messages");
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:bg-sidebar-hover hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {showMessagesBadge && (
                  <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
                    {unreadBadge > 99 ? "99+" : unreadBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-4">
          <Link
            href={process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006"}
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft className="h-3 w-3" />
            View Storefront
          </Link>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-3 w-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

function getHeaderTitle(pathname: string, role: PortalRole): string {
  if (pathname === "/") return "Operations Dashboard";
  if (pathname.startsWith("/orders")) return "Orders";
  if (pathname.startsWith("/messages")) return "Messages";
  if (pathname.startsWith("/users")) return "Users";
  if (pathname.startsWith("/products")) return "Products";
  if (pathname.startsWith("/theme")) return "Theme & Branding";
  if (pathname.startsWith("/settings")) return "Settings";
  return "MFresh Portal";
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = usePortalUser();

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/accept-invite") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/onboarding")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalSidebar />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-foreground lg:ml-0 ml-12">
              {user ? getHeaderTitle(pathname, user.role) : "MFresh Portal"}
            </h1>
            {user && (
              <div className="flex items-center gap-3">
                {user.role === "buyer" && (
                  <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Procurement workspace
                  </span>
                )}
                {user.role === "seller" && (
                  <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                    <Store className="h-3.5 w-3.5" />
                    Supplier workspace
                  </span>
                )}
                {user.role === "admin" && (
                  <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Marketplace operations
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize",
                    user.role === "admin" && "bg-violet-100 text-violet-700",
                    user.role === "buyer" && "bg-sky-100 text-sky-700",
                    user.role === "seller" && "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {user.role}
                </span>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            )}
          </div>
        </header>
        <main className="container-admin">{children}</main>
      </div>
    </div>
  );
}

export { PortalSidebar as AdminSidebar, PortalShell as AdminShell };
