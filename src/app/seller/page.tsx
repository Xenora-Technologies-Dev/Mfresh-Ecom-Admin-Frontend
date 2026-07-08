"use client";

import Link from "next/link";
import {
  Store,
  Package,
  BarChart3,
  Users,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Manage Products",
    description: "Add, edit, and publish your product listings.",
    href: "/products",
    icon: Package,
  },
  {
    title: "View Analytics",
    description: "Track views, inquiries, and performance metrics.",
    href: "#",
    icon: BarChart3,
  },
  {
    title: "Customer Inquiries",
    description: "Respond to buyer requests and RFQs.",
    href: "#",
    icon: Users,
  },
];

export default function SellerDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-50 via-white to-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">Seller Workspace</p>
            <h2 className="mt-1 text-2xl font-bold">
              Welcome, {user?.name ?? "Seller"}
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Manage your supplier profile and product catalog. List prices in USD — buyers can
              view converted AED and SGD rates on the storefront.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Store className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Listed Products", value: "—", icon: Package },
          { label: "Pending Orders", value: "0", icon: BarChart3 },
          { label: "Inquiries", value: "0", icon: Users },
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
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            Add New Product
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">View All Products</Link>
        </Button>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <action.icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold group-hover:text-emerald-700">{action.title}</h4>
              <p className="mt-1 text-sm text-muted">{action.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
