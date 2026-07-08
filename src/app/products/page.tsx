"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DataTable, StatusBadge } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/lib/api";
import { downloadCsv, formatPriceUsd } from "@/lib/utils";

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
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge active={Boolean(getValue())} />,
  },
];

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const params = { page, limit: 10, search, sortBy, sortOrder };
  const { data, isLoading } = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params),
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
            <Link
              href={`/products/${row.original.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Edit
            </Link>
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
