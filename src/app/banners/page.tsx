"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { ResourcePage } from "@/components/admin/resource-page";
import { bannersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

const BANNER_TYPES = [
  { value: "HERO_SLIDER", label: "Hero Slider" },
  { value: "OFFER", label: "Offer Banner" },
  { value: "CATEGORY", label: "Category Banner" },
  { value: "POPUP", label: "Popup Banner" },
  { value: "MOBILE", label: "Mobile Banner" },
];

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "type", header: "Type" },
  {
    accessorKey: "isEnabled",
    header: "Enabled",
    cell: ({ row, getValue }) => (
      <ToggleCell id={row.original.id as string} enabled={Boolean(getValue())} />
    ),
  },
  { accessorKey: "sortOrder", header: "Order" },
];

function ToggleCell({ id, enabled }: { id: string; enabled: boolean }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (v: boolean) => bannersApi.toggle(id, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
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

export default function BannersPage() {
  const [typeFilter, setTypeFilter] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={typeFilter === "" ? "default" : "outline"}
          onClick={() => setTypeFilter("")}
        >
          All
        </Button>
        {BANNER_TYPES.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={typeFilter === t.value ? "default" : "outline"}
            onClick={() => setTypeFilter(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <ResourcePage
        title="Banner Management"
        queryKey="banners"
        listFn={(p) => bannersApi.list({ ...p, type: typeFilter || undefined })}
        createFn={bannersApi.create}
        updateFn={bannersApi.update}
        deleteFn={bannersApi.remove}
        exportFn={bannersApi.export}
        extraParams={typeFilter ? { type: typeFilter } : undefined}
        columns={columns}
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "subtitle", label: "Subtitle" },
          { key: "image", label: "Image URL" },
          { key: "ctaText", label: "CTA Text" },
          { key: "ctaLink", label: "CTA Link" },
          {
            key: "type",
            label: "Banner Type",
            type: "select",
            options: BANNER_TYPES,
            required: true,
          },
          { key: "sortOrder", label: "Sort Order", type: "number" },
          { key: "isEnabled", label: "Enabled", type: "checkbox" },
        ]}
      />
    </div>
  );
}
