"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { DataTable } from "@/components/admin/data-table";
import { productImagesApi } from "@/lib/api";
import { downloadCsv } from "@/lib/utils";

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  {
    id: "preview",
    header: "Preview",
    cell: ({ row }) => {
      const urls = row.original.urls as { thumbnail?: string } | undefined;
      const src = urls?.thumbnail ?? "";
      return src ? (
        <div className="relative h-10 w-10 overflow-hidden rounded-lg">
          <Image src={src} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : (
        "—"
      );
    },
  },
  { accessorKey: "type", header: "Type" },
  {
    id: "product",
    header: "Product",
    cell: ({ row }) =>
      (row.original.product as { name?: string })?.name ?? "Unassigned",
  },
  { accessorKey: "width", header: "Width" },
  { accessorKey: "height", header: "Height" },
  { accessorKey: "mimeType", header: "Format" },
  {
    accessorKey: "isTemp",
    header: "Temp",
    cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
  },
];

export default function ProductImagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const params = { page, limit: 10, search, sortBy, sortOrder };
  const { data, isLoading } = useQuery({
    queryKey: ["product-images", params],
    queryFn: () => productImagesApi.list(params),
  });

  return (
    <DataTable
      title="Product Images"
      columns={columns}
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
        const csv = await productImagesApi.export(params);
        downloadCsv(csv, "product-images.csv");
      }}
    />
  );
}
