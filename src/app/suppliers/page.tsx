"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/admin/data-table";
import { suppliersApi } from "@/lib/api";

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "country", header: "Country" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "rating", header: "Rating" },
  {
    accessorKey: "verified",
    header: "Verified",
    cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge active={Boolean(getValue())} />,
  },
];

export default function SuppliersPage() {
  return (
    <ResourcePage
      title="Suppliers"
      queryKey="suppliers"
      listFn={suppliersApi.list}
      createFn={suppliersApi.create}
      updateFn={suppliersApi.update}
      deleteFn={suppliersApi.remove}
      exportFn={suppliersApi.export}
      columns={columns}
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "country", label: "Country" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "rating", label: "Rating", type: "number" },
        { key: "verified", label: "Verified", type: "checkbox" },
        { key: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
