"use client";

import { Suspense, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, StatusBadge } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/lib/api";
import { downloadCsv, formatApiError, formatPriceUsd } from "@/lib/utils";

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) =>
      (row.original.category as { name?: string })?.name ?? "—",
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => {
      const min = Number(row.original.minPrice ?? row.original.price ?? 0);
      const max = Number(row.original.maxPrice ?? min);
      const unit = String(row.original.unit ?? row.original.moqUnit ?? "");
      const range =
        min === max
          ? formatPriceUsd(min)
          : `${formatPriceUsd(min)} – ${formatPriceUsd(max)}`;
      return unit ? `${range}/${unit}` : range;
    },
  },
  {
    id: "moq",
    header: "MOQ",
    cell: ({ row }) => {
      const moq = row.original.moq as number;
      const unit = String(row.original.unit ?? row.original.moqUnit ?? "");
      return unit ? `${moq} ${unit}` : String(moq);
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const soldOut = Boolean(row.original.soldOut);
      const active = Boolean(row.original.isActive);
      if (!active) return <StatusBadge active={false} />;
      if (soldOut) {
        return (
          <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            Sold Out
          </span>
        );
      }
      return <StatusBadge active />;
    },
  },
];

function ProductsPageContent() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") === "asc" ? "asc" : "desc") as
    | "asc"
    | "desc";

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const params = { page, limit: 10, search, sortBy, sortOrder, isActive: undefined };
  const { data, isLoading } = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const returnQs = page > 1 ? `?returnPage=${page}` : "";

  return (
    <DataTable
      title="Products"
      columns={[
        ...columns,
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Link
                href={`/products/${row.original.id}/view${returnQs}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
              <Link
                href={`/products/${row.original.id}${returnQs}`}
                className="text-sm font-medium text-muted hover:text-primary hover:underline"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this product permanently?"))
                    deleteMutation.mutate(row.original.id as string);
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          ),
        },
      ]}
      data={data?.data ?? []}
      total={data?.meta.total ?? 0}
      page={page}
      limit={10}
      search={search}
      sortBy={sortBy}
      sortOrder={sortOrder}
      isLoading={isLoading}
      onPageChange={(p) =>
        updateParams({ page: p <= 1 ? null : String(p) })
      }
      onSearchChange={(s) => {
        updateParams({ search: s || null, page: null });
      }}
      onSortChange={(sb, so) => {
        updateParams({
          sortBy: sb === "createdAt" ? null : sb,
          sortOrder: so === "desc" ? null : so,
        });
      }}
      onExport={async () => {
        const csv = await productsApi.export(params);
        downloadCsv(csv, "products.csv");
      }}
      actions={
        <Button size="sm" asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      }
    />
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm text-muted">Loading products…</div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
