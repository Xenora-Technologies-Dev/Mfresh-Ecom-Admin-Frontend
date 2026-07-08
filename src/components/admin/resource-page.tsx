"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { downloadCsv } from "@/lib/utils";
import type { ListParams, PaginatedResponse } from "@/lib/api/client";

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "checkbox" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface ResourcePageProps {
  title: string;
  queryKey: string;
  listFn: (p: ListParams) => Promise<PaginatedResponse<Record<string, unknown>>>;
  createFn?: (data: Record<string, unknown>) => Promise<unknown>;
  updateFn?: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  deleteFn?: (id: string) => Promise<unknown>;
  exportFn?: (p: ListParams) => Promise<string>;
  columns: ColumnDef<Record<string, unknown>, unknown>[];
  fields: FieldConfig[];
  extraParams?: Record<string, string>;
}

export function ResourcePage({
  title,
  queryKey,
  listFn,
  createFn,
  updateFn,
  deleteFn,
  exportFn,
  columns,
  fields,
  extraParams,
}: ResourcePageProps) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const params: ListParams = {
    page,
    limit: 10,
    search,
    sortBy,
    sortOrder,
    ...extraParams,
  };

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => listFn(params),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing?.id) return updateFn?.(editing.id as string, form);
      return createFn?.(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setModalOpen(false);
      setEditing(null);
      setForm({});
      toast.success("Saved successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn!(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
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
          {updateFn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditing(row.original);
                setForm(row.original);
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {deleteFn && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title={title}
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
        onExport={
          exportFn
            ? async () => {
                const csv = await exportFn(params);
                downloadCsv(csv, `${queryKey}.csv`);
              }
            : undefined
        }
        actions={
          createFn ? (
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
          ) : undefined
        }
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">
              {editing ? "Edit" : "Create"} {title.replace(/s$/, "")}
            </h3>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={f.key}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                    />
                  ) : f.type === "checkbox" ? (
                    <input
                      id={f.key}
                      type="checkbox"
                      checked={Boolean(form[f.key])}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  ) : f.type === "select" ? (
                    <select
                      id={f.key}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                      className="flex h-10 w-full rounded-lg border border-border px-3 text-sm"
                    >
                      <option value="">Select...</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={f.key}
                      type={f.type ?? "text"}
                      required={f.required}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [f.key]:
                            f.type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              ))}
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
