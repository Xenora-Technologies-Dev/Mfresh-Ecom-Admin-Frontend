"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BannerImageUploader } from "@/components/admin/banner-image-uploader";
import { useUploadGuard } from "@/hooks/use-upload-guard";
import { bannersApi } from "@/lib/api";
import { storageUrl } from "@/lib/api/client";
import { downloadCsv, formatApiError } from "@/lib/utils";

const BANNER_TYPES = [
  { value: "HERO_SLIDER", label: "Hero Slider" },
  { value: "OFFER", label: "Offer Banner" },
  { value: "CATEGORY", label: "Category Banner" },
  { value: "POPUP", label: "Popup Banner" },
  { value: "MOBILE", label: "Mobile Banner" },
];

function toBannerPayload(form: Record<string, unknown>) {
  return {
    title: String(form.title ?? "").trim(),
    subtitle: form.subtitle ? String(form.subtitle) : null,
    image: form.image ? String(form.image) : null,
    ctaText: form.ctaText ? String(form.ctaText) : null,
    ctaLink: form.ctaLink ? String(form.ctaLink) : null,
    type: String(form.type ?? "HERO_SLIDER"),
    sortOrder: Number(form.sortOrder) || 0,
    isEnabled: form.isEnabled !== false,
  };
}

function toBannerForm(row: Record<string, unknown>) {
  return {
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    image: row.image ?? "",
    imageUrl: row.imageUrl,
    ctaText: row.ctaText ?? "",
    ctaLink: row.ctaLink ?? "",
    type: row.type ?? "HERO_SLIDER",
    sortOrder: row.sortOrder ?? 0,
    isEnabled: row.isEnabled !== false,
  };
}

function ToggleCell({ id, enabled }: { id: string; enabled: boolean }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (v: boolean) => bannersApi.toggle(id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success(enabled ? "Banner disabled" : "Banner enabled");
    },
    onError: (err) => toast.error(formatApiError(err)),
  });
  return (
    <Button
      size="sm"
      variant={enabled ? "default" : "outline"}
      onClick={() => toggle.mutate(!enabled)}
      disabled={toggle.isPending}
    >
      {enabled ? "Enabled" : "Disabled"}
    </Button>
  );
}

const baseColumns: ColumnDef<Record<string, unknown>, unknown>[] = [
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }) => {
      const url = storageUrl(
        (row.original.imageUrl as string) ?? (row.original.image as string),
      );
      if (!url) return <span className="text-xs text-muted">—</span>;
      return (
        <div className="relative h-10 w-16 overflow-hidden rounded-md border border-border">
          <Image src={url} alt="" fill className="object-cover" unoptimized />
        </div>
      );
    },
  },
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

export default function BannersPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({
    type: "HERO_SLIDER",
    isEnabled: true,
    sortOrder: 0,
  });
  const [imageUploading, setImageUploading] = useState(false);
  const { requestClose } = useUploadGuard(imageUploading);

  const closeModal = () => {
    if (!requestClose()) return;
    setModalOpen(false);
    setImageUploading(false);
  };

  const params = {
    page,
    limit: 10,
    search,
    sortBy,
    sortOrder,
    ...(typeFilter ? { type: typeFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["banners", params],
    queryFn: () => bannersApi.list(params),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title) throw new Error("Title is required.");
      if (!form.type) throw new Error("Banner type is required.");
      const payload = toBannerPayload(form);
      if (editing?.id) return bannersApi.update(editing.id as string, payload);
      return bannersApi.create(payload);
    },
    onSuccess: () => {
      const wasEdit = Boolean(editing?.id);
      qc.invalidateQueries({ queryKey: ["banners"] });
      setModalOpen(false);
      setEditing(null);
      setForm({ type: typeFilter || "HERO_SLIDER", isEnabled: true, sortOrder: 0 });
      toast.success(
        wasEdit ? "Banner updated successfully" : "Banner created successfully",
      );
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted successfully");
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const actionColumns: ColumnDef<Record<string, unknown>, unknown>[] = [
    ...baseColumns,
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
              setForm(toBannerForm(row.original));
              setModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Delete this banner?"))
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={typeFilter === "" ? "default" : "outline"}
          onClick={() => {
            setTypeFilter("");
            setPage(1);
          }}
        >
          All
        </Button>
        {BANNER_TYPES.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={typeFilter === t.value ? "default" : "outline"}
            onClick={() => {
              setTypeFilter(t.value);
              setPage(1);
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <DataTable
        title="Banner Management"
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
          const csv = await bannersApi.export(params);
          downloadCsv(csv, "banners.csv");
        }}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm({
                type: typeFilter || "HERO_SLIDER",
                isEnabled: true,
                sortOrder: 0,
              });
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Banner
          </Button>
        }
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">
              {editing ? "Edit" : "Create"} Banner
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  value={String(form.title ?? "")}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle</Label>
                <Input
                  value={String(form.subtitle ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                />
              </div>
              <BannerImageUploader
                value={form.image as string | undefined}
                imageUrl={form.imageUrl as string | undefined}
                bannerId={editing?.id as string | undefined}
                onChange={(path) => setForm({ ...form, image: path })}
                onUploadingChange={setImageUploading}
              />
              <div className="space-y-1.5">
                <Label>CTA Text</Label>
                <Input
                  value={String(form.ctaText ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, ctaText: e.target.value })
                  }
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CTA Link</Label>
                <Input
                  value={String(form.ctaLink ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, ctaLink: e.target.value })
                  }
                  placeholder="e.g. /products"
                />
                <p className="text-xs text-muted">
                  Hero sliders on the storefront link the entire slide to this URL.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Banner Type *</Label>
                <select
                  value={String(form.type ?? "HERO_SLIDER")}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-border px-3 text-sm"
                >
                  {BANNER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted">
                  <strong>Hero Slider</strong> → homepage hero. <strong>Offer</strong> → promo cards (if section is used).
                </p>
              </div>
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
                  checked={form.isEnabled !== false}
                  onChange={(e) =>
                    setForm({ ...form, isEnabled: e.target.checked })
                  }
                />
                Enabled (visible on storefront)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || imageUploading}
              >
                {imageUploading
                  ? "Uploading…"
                  : saveMutation.isPending
                    ? "Saving…"
                    : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
