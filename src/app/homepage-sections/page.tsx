"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { ResourcePage } from "@/components/admin/resource-page";
import { homepageSectionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  { accessorKey: "key", header: "Key" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "subtitle", header: "Subtitle" },
  {
    accessorKey: "isEnabled",
    header: "Enabled",
    cell: ({ row, getValue }) => (
      <SectionToggle id={row.original.id as string} enabled={Boolean(getValue())} />
    ),
  },
  { accessorKey: "sortOrder", header: "Order" },
];

function SectionToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (v: boolean) => homepageSectionsApi.toggle(id, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homepage-sections"] }),
  });
  return (
    <Button
      size="sm"
      variant={enabled ? "default" : "outline"}
      onClick={() => toggle.mutate(!enabled)}
    >
      {enabled ? "Enabled" : "Disabled"}
    </Button>
  );
}

export default function HomepageSectionsPage() {
  return (
    <ResourcePage
      title="Homepage Sections"
      queryKey="homepage-sections"
      listFn={homepageSectionsApi.list}
      createFn={homepageSectionsApi.create}
      updateFn={homepageSectionsApi.update}
      deleteFn={homepageSectionsApi.remove}
      exportFn={homepageSectionsApi.export}
      columns={columns}
      fields={[
        { key: "key", label: "Section Key", required: true },
        { key: "title", label: "Title", required: true },
        { key: "subtitle", label: "Subtitle" },
        { key: "sortOrder", label: "Sort Order", type: "number" },
        { key: "isEnabled", label: "Enabled", type: "checkbox" },
      ]}
    />
  );
}
