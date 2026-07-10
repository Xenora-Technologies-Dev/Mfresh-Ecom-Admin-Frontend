"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { DataTable, StatusBadge } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CategoryImageUploader } from "@/components/admin/category-image-uploader";
import { downloadCsv, formatApiError } from "@/lib/utils";
import { subCategoriesApi, categoriesApi } from "@/lib/api";
import { storageUrl } from "@/lib/api/client";

function toSubCategoryPayload(form: Record<string, unknown>) {
  return {
    name: String(form.name ?? "").trim(),
    categoryId: String(form.categoryId ?? ""),
    image: form.image ? String(form.image) : null,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive !== false,
  };
}

function toSubCategoryForm(row: Record<string, unknown>) {
  return {
    name: row.name ?? "",
    categoryId: row.categoryId ?? "",
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
      if (!url) return <span className="text-xs text-muted">—</span>;
      return (
        <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border">
          <Image src={url} alt="" fill className="object-cover" unoptimized />
        </div>
      );
    },
  },
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
    queryKey: ["sub-categories", params],
    queryFn: () => subCategoriesApi.list(params),
  });

  const { data: cats } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.categoryId) {
        throw new Error("Name and category are required.");
      }
      const payload = toSubCategoryPayload(form);
      if (editing?.id) return subCategoriesApi.update(editing.id as string, payload);
      return subCategoriesApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-categories"] });
      setModalOpen(false);
      setEditing(null);
      setForm({});
      toast.success("Saved successfully");
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subCategoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-categories"] });
      toast.success("Deleted successfully");
    },
    onError: (err) => toast.error(formatApiError(err)),
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
              setForm(toSubCategoryForm(row.original));
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
        title="Sub Categories"
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
          const csv = await subCategoriesApi.export(params);
          downloadCsv(csv, "sub-categories.csv");
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
              {editing ? "Edit" : "Create"} Sub Category
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
                <Label>Category *</Label>
                <select
                  value={String(form.categoryId ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-lg border border-border px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {cats?.data.map((c) => (
                    <option key={c.id as string} value={c.id as string}>
                      {c.name as string}
                    </option>
                  ))}
                </select>
              </div>
              <CategoryImageUploader
                label="Sub Category Image"
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
