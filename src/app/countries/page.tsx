"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/admin/data-table";
import { countriesApi } from "@/lib/api";

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  { accessorKey: "flag", header: "Flag" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "code", header: "Code" },
  { accessorKey: "supplierCount", header: "Suppliers" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge active={Boolean(getValue())} />,
  },
];

export default function CountriesPage() {
  return (
    <ResourcePage
      title="Countries"
      queryKey="countries"
      listFn={countriesApi.list}
      createFn={countriesApi.create}
      updateFn={countriesApi.update}
      deleteFn={countriesApi.remove}
      exportFn={countriesApi.export}
      columns={columns}
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "code", label: "Code", required: true },
        { key: "flag", label: "Flag Emoji" },
        { key: "supplierCount", label: "Supplier Count", type: "number" },
        { key: "sortOrder", label: "Sort Order", type: "number" },
        { key: "isActive", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
