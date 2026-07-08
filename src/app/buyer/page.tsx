"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Package,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Globe,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

const storefront =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

const quickActions = [
  {
    title: "Browse Catalog",
    description: "Explore products from verified global suppliers.",
    href: `${storefront}/products`,
    icon: Package,
  },
  {
    title: "Find Suppliers",
    description: "Discover and connect with trusted food suppliers.",
    href: `${storefront}/suppliers`,
    icon: Globe,
  },
  {
    title: "My Orders",
    description: "Track purchase orders and delivery status.",
    href: "#",
    icon: ClipboardList,
  },
];

export default function BuyerDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">Buyer Workspace</p>
            <h2 className="mt-1 text-2xl font-bold">
              Welcome back, {user?.name ?? "Buyer"}
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Source premium food ingredients at wholesale prices. All prices are listed in USD
              with optional AED and SGD conversion on the storefront.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <ShoppingBag className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active Orders", value: "0", icon: ClipboardList },
          { label: "Saved Products", value: "0", icon: Package },
          { label: "Suppliers", value: "—", icon: TrendingUp },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <action.icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold group-hover:text-sky-700">{action.title}</h4>
              <p className="mt-1 text-sm text-muted">{action.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-white/50 p-6 text-center">
        <p className="text-sm text-muted">
          Order management and RFQ features are coming soon. Browse the storefront to discover products today.
        </p>
        <Button className="mt-4" asChild>
          <Link href={`${storefront}/products`} target="_blank">
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
