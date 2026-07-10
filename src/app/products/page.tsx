"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
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
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) =>
      (row.original.supplier as { name?: string })?.name ?? "—",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ getValue }) => formatPriceUsd(Number(getValue())),
  },
  { accessorKey: "moq", header: "MOQ" },
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

export default function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
                href={`/products/${row.original.id}/view`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
              <Link
                href={`/products/${row.original.id}`}
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
      onPageChange={setPage}
      onSearchChange={(s) => {
        setSearch(s);
        setPage(1);
      }}
      onSortChange={(sb, so) => {
        setSortBy(sb);
        setSortOrder(so);
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
