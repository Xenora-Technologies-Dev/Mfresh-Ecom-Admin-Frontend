"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  MultiImageUploader,
  type UploadedImage,
} from "@/components/admin/multi-image-uploader";
import {
  productsApi,
  categoriesApi,
  subCategoriesApi,
  suppliersApi,
} from "@/lib/api";
import { storageUrl } from "@/lib/api/client";

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const productId = isNew ? null : (params.id as string);

  const [form, setForm] = useState<Record<string, unknown>>({
    currency: "USD",
    isActive: true,
  });
  const [newImageIds, setNewImageIds] = useState<string[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const p = await productsApi.get(productId!);
      setForm(p);
      if (!imagesLoaded) {
        const existing = (
          (p.imageUrls as {
            id: string;
            type: string;
            display?: string;
            thumbnail?: string;
            medium?: string;
            large?: string;
          }[]) ?? []
        ).map((img) => ({
          id: img.id,
          type: img.type,
          urls: {
            display: storageUrl(img.display ?? ""),
            thumbnail: storageUrl(img.thumbnail ?? ""),
            medium: storageUrl(img.medium ?? ""),
            large: storageUrl(img.large ?? ""),
          },
        }));
        setImages(existing);
        setImagesLoaded(true);
      }
      return p;
    },
    enabled: !!productId,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
  });
  const { data: subCategories } = useQuery({
    queryKey: ["sub-categories-all"],
    queryFn: () => subCategoriesApi.list({ limit: 100 }),
  });
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-all"],
    queryFn: () => suppliersApi.list({ limit: 100 }),
  });

  const save = useMutation({
    mutationFn: async () => {
      const { imageUrls, imageUrl, category, subCategory, supplier, images, ...rest } =
        form as Record<string, unknown>;
      const payload = {
        ...rest,
        imageIds: newImageIds,
        subCategoryId: form.subCategoryId || null,
      };
      if (isNew) return productsApi.create(payload);
      return productsApi.update(productId!, payload);
    },
    onSuccess: () => router.push("/products"),
  });

  const filteredSubs = subCategories?.data.filter(
    (s) => s.categoryId === form.categoryId,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isNew ? "Create Product" : "Edit Product"}
        </h2>
        <p className="text-muted">Manage product details and images</p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name *</Label>
            <Input
              value={String(form.name ?? "")}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={String(form.description ?? "")}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Price (USD) *</Label>
            <Input
              type="number"
              value={String(form.price ?? "")}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>MOQ *</Label>
            <Input
              type="number"
              value={String(form.moq ?? "")}
              onChange={(e) =>
                setForm({ ...form, moq: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>MOQ Unit</Label>
            <Input
              value={String(form.moqUnit ?? "kg")}
              onChange={(e) => setForm({ ...form, moqUnit: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input
              value={String(form.country ?? "")}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <select
              value={String(form.categoryId ?? "")}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value, subCategoryId: "" })
              }
              className="flex h-10 w-full rounded-lg border border-border px-3 text-sm"
            >
              <option value="">Select...</option>
              {categories?.data.map((c) => (
                <option key={c.id as string} value={c.id as string}>
                  {c.name as string}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Sub Category (optional)</Label>
            <select
              value={String(form.subCategoryId ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  subCategoryId: e.target.value || undefined,
                })
              }
              className="flex h-10 w-full rounded-lg border border-border px-3 text-sm"
            >
              <option value="">Select...</option>
              {filteredSubs?.map((s) => (
                <option key={s.id as string} value={s.id as string}>
                  {s.name as string}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Supplier *</Label>
            <select
              value={String(form.supplierId ?? "")}
              onChange={(e) =>
                setForm({ ...form, supplierId: e.target.value })
              }
              className="flex h-10 w-full rounded-lg border border-border px-3 text-sm"
            >
              <option value="">Select...</option>
              {suppliers?.data.map((s) => (
                <option key={s.id as string} value={s.id as string}>
                  {s.name as string}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.featured)}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.popular)}
              onChange={(e) => setForm({ ...form, popular: e.target.checked })}
            />
            Popular
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.isNew)}
              onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
            />
            New Arrival
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <MultiImageUploader
          label="Product Images (upload as many as needed)"
          images={images}
          onChange={setImages}
          newImageIds={newImageIds}
          onNewIds={setNewImageIds}
        />
        {newImageIds.length > 0 && (
          <p className="mt-3 text-sm text-primary">
            {newImageIds.length} new image(s) will be saved with this product
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save Product"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
