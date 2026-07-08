"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, Users, Truck, FolderTree, PanelTop } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { formatDate, formatPriceUsd } from "@/lib/utils";

const statCards = [
  { key: "products", label: "Products", icon: Package, color: "bg-primary/10 text-primary" },
  { key: "customers", label: "Customers", icon: Users, color: "bg-blue-100 text-blue-700" },
  { key: "suppliers", label: "Suppliers", icon: Truck, color: "bg-secondary/10 text-secondary" },
  { key: "categories", label: "Categories", icon: FolderTree, color: "bg-purple-100 text-purple-700" },
  { key: "banners", label: "Banners", icon: PanelTop, color: "bg-pink-100 text-pink-700" },
];

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.stats(),
    retry: false,
  });

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h2 className="font-semibold">Backend not connected</h2>
        <p className="mt-2 text-sm">
          Start the API server: <code className="rounded bg-amber-100 px-1">cd Backend && npm run start:dev</code>
        </p>
        <p className="mt-1 text-sm">
          Ensure PostgreSQL is running and run <code className="rounded bg-amber-100 px-1">npm run prisma:migrate</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Operations Dashboard</h2>
        <p className="text-muted">Marketplace overview and management</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{card.label}</p>
                <p className="mt-1 text-3xl font-bold">
                  {isLoading ? "—" : data?.counts[card.key] ?? 0}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold">Recent Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-left font-medium">Category</th>
                <th className="px-6 py-3 text-left font-medium">Supplier</th>
                <th className="px-6 py-3 text-left font-medium">Price</th>
                <th className="px-6 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              ) : (
                (data?.recentProducts ?? []).map((p) => (
                  <tr key={p.id as string} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 font-medium">{p.name as string}</td>
                    <td className="px-6 py-3 text-muted">
                      {(p.category as { name?: string })?.name ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {(p.supplier as { name?: string })?.name ?? "—"}
                    </td>
                    <td className="px-6 py-3">{formatPriceUsd(p.price as number)}</td>
                    <td className="px-6 py-3 text-muted">
                      {formatDate(p.createdAt as string)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
