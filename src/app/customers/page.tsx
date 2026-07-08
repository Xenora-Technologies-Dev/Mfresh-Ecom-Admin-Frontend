"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/admin/data-table";
import { customersApi } from "@/lib/api";

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  { accessorKey: "businessName", header: "Business" },
  { accessorKey: "contactName", header: "Contact" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "businessType", header: "Type" },
  { accessorKey: "country", header: "Country" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge active={Boolean(getValue())} />,
  },
];

export default function CustomersPage() {
  return (
    <ResourcePage
      title="Customers"
      queryKey="customers"
      listFn={customersApi.list}
      createFn={customersApi.create}
      updateFn={customersApi.update}
      deleteFn={customersApi.remove}
      exportFn={customersApi.export}
      columns={columns}
      fields={[
        { key: "businessName", label: "Business Name", required: true },
        { key: "contactName", label: "Contact Name", required: true },
        { key: "email", label: "Email", required: true },
        { key: "phone", label: "Phone" },
        { key: "businessType", label: "Business Type" },
        { key: "country", label: "Country" },
        { key: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
