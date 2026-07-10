"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  ProductImagesManager,
  splitProductImages,
} from "@/components/admin/product-images-manager";
import { ProductSpecsForm } from "@/components/admin/product-specs-form";
import { CountrySelect } from "@/components/admin/country-select";
import type { UploadedImage } from "@/components/admin/multi-image-uploader";
import {
  productsApi,
  categoriesApi,
  subCategoriesApi,
  suppliersApi,
} from "@/lib/api";
import { storageUrl } from "@/lib/api/client";
import { formatApiError } from "@/lib/utils";

type ImageUrlRow = {
  id: string;
  type: string;
  display?: string | null;
  thumbnail?: string | null;
  medium?: string | null;
  large?: string | null;
  original?: string | null;
};

function normalizeSpecs(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
      k,
      v == null ? "" : String(v),
    ]),
  );
}

function mapApiImages(raw: unknown): UploadedImage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as ImageUrlRow[])
    .filter((img) => img?.id)
    .map((img) => {
      const display = storageUrl(img.display || img.large || img.medium || img.original || "");
      const large = storageUrl(img.large || img.display || img.medium || img.original || "");
      const medium = storageUrl(img.medium || img.display || img.large || "");
      const thumbnail = storageUrl(img.thumbnail || img.medium || img.display || "");
      return {
        id: img.id,
        type: String(img.type || "").toUpperCase(),
        urls: { display, thumbnail, medium, large },
      };
    });
}

function buildFormFromProduct(p: Record<string, unknown>) {
  return {
    name: p.name ?? "",
    description: p.description ?? "",
    price: p.price ?? "",
    currency: p.currency ?? "USD",
    moq: p.moq ?? "",
    moqUnit: p.moqUnit ?? "kg",
    country: p.country ?? "",
    categoryId: p.categoryId ?? "",
    subCategoryId: p.subCategoryId ?? "",
    supplierId: p.supplierId ?? "",
    featured: Boolean(p.featured),
    popular: Boolean(p.popular),
    isNew: Boolean(p.isNew),
    isActive: p.isActive !== false,
    soldOut: Boolean(p.soldOut),
    specifications: normalizeSpecs(p.specifications),
  };
}

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const productId = isNew ? null : (params.id as string);
  const hydratedId = useRef<string | null>(null);

  const [form, setForm] = useState<Record<string, unknown>>({
    currency: "USD",
    isActive: true,
    soldOut: false,
    specifications: {},
  });
  const [displayImage, setDisplayImage] = useState<UploadedImage | null>(null);
  const [mainImage, setMainImage] = useState<UploadedImage | null>(null);
  const [subImages, setSubImages] = useState<UploadedImage[]>([]);
  const [newImageIds, setNewImageIds] = useState<string[]>([]);

  const specs =
    (form.specifications as Record<string, string> | null | undefined) ?? {};

  const setSpecs = (next: Record<string, string>) =>
    setForm((f) => ({ ...f, specifications: next }));

  const {
    data: product,
    isLoading: productLoading,
    isError: productError,
    error: productErr,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.get(productId!),
    enabled: !!productId,
  });

  useEffect(() => {
    if (!productId || !product) return;
    if (hydratedId.current === productId) return;
    hydratedId.current = productId;

    setForm(buildFormFromProduct(product));

    const split = splitProductImages(
      mapApiImages(product.imageUrls).map((img) => ({
        id: img.id,
        type: img.type,
        display: img.urls.display,
        thumbnail: img.urls.thumbnail,
        medium: img.urls.medium,
        large: img.urls.large,
      })),
    );
    setDisplayImage(split.display);
    setMainImage(split.main);
    setSubImages(split.subs);
    setNewImageIds([]);
  }, [product, productId]);

  // When navigating to a different product id, allow re-hydration
  useEffect(() => {
    return () => {
      hydratedId.current = null;
    };
  }, [productId]);

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
      if (!form.name || !form.price || !form.moq || !form.categoryId || !form.supplierId) {
        throw new Error(
          "Please fill in all required fields: name, price, MOQ, category, and supplier.",
        );
      }

      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        currency: form.currency || "USD",
        moq: Number(form.moq),
        moqUnit: form.moqUnit || "kg",
        country: form.country || null,
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        supplierId: form.supplierId,
        featured: Boolean(form.featured),
        popular: Boolean(form.popular),
        isNew: Boolean(form.isNew),
        isActive: form.isActive !== false,
        soldOut: Boolean(form.soldOut),
        specifications: specs,
        imageIds: newImageIds,
      };

      if (isNew) return productsApi.create(payload);
      return productsApi.update(productId!, payload);
    },
    onSuccess: () => {
      toast.success(isNew ? "Product created successfully" : "Product saved successfully");
      router.push("/products");
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const filteredSubs = subCategories?.data.filter(
    (s) => s.categoryId === form.categoryId,
  );

  if (!isNew && productLoading) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-muted">
        Loading product…
      </div>
    );
  }

  if (!isNew && productError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-16 text-center">
        <p className="text-sm text-red-600">
          Could not load product: {formatApiError(productErr)}
        </p>
        <Button variant="outline" onClick={() => router.push("/products")}>
          Back to products
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isNew ? "Create Product" : "Edit Product"}
        </h2>
        <p className="text-muted">
          {isNew
            ? "Add product details and images"
            : "Existing details and images are loaded below — edit and save to update"}
        </p>
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
            <CountrySelect
              value={String(form.country ?? "")}
              onChange={(country) => setForm({ ...form, country })}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.soldOut)}
              onChange={(e) => setForm({ ...form, soldOut: e.target.checked })}
              disabled={form.isActive === false}
            />
            Sold Out
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Product Detail Fields</h3>
        <ProductSpecsForm value={specs} onChange={setSpecs} />
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Product Images</h3>
        <ProductImagesManager
          displayImage={displayImage}
          mainImage={mainImage}
          subImages={subImages}
          newImageIds={newImageIds}
          onDisplayChange={setDisplayImage}
          onMainChange={setMainImage}
          onSubChange={setSubImages}
          onNewIdsChange={setNewImageIds}
        />
        {newImageIds.length > 0 && (
          <p className="mt-4 text-sm text-primary">
            {newImageIds.length} new image(s) will be linked when you save.
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
