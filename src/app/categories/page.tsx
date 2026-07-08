"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { CategoryImageUploader } from "@/components/admin/category-image-uploader";
import { downloadCsv } from "@/lib/utils";
import { categoriesApi } from "@/lib/api";
import { storageUrl } from "@/lib/api/client";
import { StatusBadge } from "@/components/admin/data-table";

function toCategoryPayload(form: Record<string, unknown>) {
  return {
    name: String(form.name ?? "").trim(),
    description: form.description ? String(form.description) : null,
    image: form.image ? String(form.image) : null,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive !== false,
  };
}

function toCategoryForm(row: Record<string, unknown>) {
  return {
    name: row.name ?? "",
    description: row.description ?? "",
    image: row.image ?? "",
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder ?? 0,
    isActive: row.isActive !== false,
  };
}

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }) => {
      const url = storageUrl(
        (row.original.imageUrl as string) ?? (row.original.image as string),
      );
      if (!url) return <span className="text-muted text-xs">—</span>;
      return (
        <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border">
          <Image src={url} alt="" fill className="object-cover" unoptimized />
        </div>
      );
    },
  },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "slug", header: "Slug" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge active={Boolean(getValue())} />,
  },
  { accessorKey: "sortOrder", header: "Order" },
];

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const params = { page, limit: 10, search, sortBy, sortOrder };

  const { data, isLoading } = useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesApi.list(params),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toCategoryPayload(form);
      if (editing?.id) return categoriesApi.update(editing.id as string, payload);
      return categoriesApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setModalOpen(false);
      setEditing(null);
      setForm({});
      toast.success("Saved successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const actionColumns: ColumnDef<Record<string, unknown>, unknown>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(row.original);
              setForm(toCategoryForm(row.original));
              setModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Delete this record?"))
                deleteMutation.mutate(row.original.id as string);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Categories"
        columns={actionColumns}
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
          const csv = await categoriesApi.export(params);
          downloadCsv(csv, "categories.csv");
        }}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm({});
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        }
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">
              {editing ? "Edit" : "Create"} Category
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={String(form.name ?? "")}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={String(form.description ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <CategoryImageUploader
                value={form.image as string | undefined}
                imageUrl={form.imageUrl as string | undefined}
                categoryId={editing?.id as string | undefined}
                onChange={(path) => setForm({ ...form, image: path })}
              />
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={String(form.sortOrder ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive !== false}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
