"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/admin/data-table";
import { subCategoriesApi, categoriesApi } from "@/lib/api";

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) =>
      (row.original.category as { name?: string })?.name ?? "—",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge active={Boolean(getValue())} />,
  },
  { accessorKey: "sortOrder", header: "Order" },
];

export default function SubCategoriesPage() {
  const { data: cats } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
  });

  const catOptions =
    cats?.data.map((c) => ({
      value: c.id as string,
      label: c.name as string,
    })) ?? [];

  return (
    <ResourcePage
      title="Sub Categories"
      queryKey="sub-categories"
      listFn={subCategoriesApi.list}
      createFn={subCategoriesApi.create}
      updateFn={subCategoriesApi.update}
      deleteFn={subCategoriesApi.remove}
      exportFn={subCategoriesApi.export}
      columns={columns}
      fields={[
        { key: "name", label: "Name", required: true },
        {
          key: "categoryId",
          label: "Category",
          type: "select",
          options: catOptions,
          required: true,
        },
        { key: "sortOrder", label: "Sort Order", type: "number" },
        { key: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
