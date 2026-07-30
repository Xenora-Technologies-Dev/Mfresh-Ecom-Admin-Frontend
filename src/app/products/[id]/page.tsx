"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { useUploadGuard } from "@/hooks/use-upload-guard";
import { productsApi, categoriesApi } from "@/lib/api";
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
    minPrice: p.minPrice ?? p.price ?? "",
    maxPrice: p.maxPrice ?? p.price ?? "",
    currency: p.currency ?? "USD",
    moq: p.moq ?? "",
    unit: p.unit ?? p.moqUnit ?? "kg",
    country: p.country ?? "",
    categoryId: p.categoryId ?? "",
    featured: Boolean(p.featured),
    popular: Boolean(p.popular),
    isNew: Boolean(p.isNew),
    isActive: p.isActive !== false,
    soldOut: Boolean(p.soldOut),
    specifications: normalizeSpecs(p.specifications),
  };
}

function productsListHref(returnPage: string | null, isNew: boolean) {
  // New products sort to the top (createdAt desc) → page 1.
  // Edits return to the page the user came from.
  if (isNew) return "/products";
  const page = Number(returnPage);
  if (Number.isFinite(page) && page > 1) return `/products?page=${page}`;
  return "/products";
}

export default function ProductFormPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl py-16 text-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <ProductFormPageContent />
    </Suspense>
  );
}

function ProductFormPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const isNew = params.id === "new";
  const productId = isNew ? null : (params.id as string);
  const returnPage = searchParams.get("returnPage");
  const listHref = productsListHref(returnPage, isNew);
  const hydratedId = useRef<string | null>(null);

  const [form, setForm] = useState<Record<string, unknown>>({
    currency: "USD",
    unit: "kg",
    isActive: true,
    soldOut: false,
    specifications: {},
  });
  const [displayImage, setDisplayImage] = useState<UploadedImage | null>(null);
  const [additionalImages, setAdditionalImages] = useState<UploadedImage[]>([]);
  const [newImageIds, setNewImageIds] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const { requestClose } = useUploadGuard(imageUploading);

  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "new" | "exists">("idle");
  const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkProductName = useCallback(
    (name: string) => {
      if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
      const trimmed = name.trim();
      if (!trimmed) {
        setNameStatus("idle");
        return;
      }
      setNameStatus("checking");
      nameCheckTimer.current = setTimeout(async () => {
        try {
          const result = await productsApi.checkName(trimmed, productId ?? undefined);
          setNameStatus(result.exists ? "exists" : "new");
        } catch {
          setNameStatus("idle");
        }
      }, 400);
    },
    [productId],
  );

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
    setAdditionalImages(split.additional);
    setNewImageIds([]);
  }, [product, productId]);

  useEffect(() => {
    return () => {
      hydratedId.current = null;
    };
  }, [productId]);

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (
        !form.name ||
        form.minPrice === "" ||
        form.minPrice == null ||
        form.maxPrice === "" ||
        form.maxPrice == null ||
        !form.unit ||
        !form.moq ||
        !form.categoryId
      ) {
        throw new Error(
          "Please fill in all required fields: name, min price, max price, unit, MOQ, and category.",
        );
      }

      const minPrice = Number(form.minPrice);
      const maxPrice = Number(form.maxPrice);
      if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
        throw new Error("Min and max price must be valid numbers.");
      }
      if (minPrice > maxPrice) {
        throw new Error("Min price cannot be greater than max price.");
      }

      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || null,
        minPrice,
        maxPrice,
        currency: form.currency || "USD",
        moq: Number(form.moq),
        unit: String(form.unit).trim() || "kg",
        country: form.country || null,
        categoryId: form.categoryId,
        supplierId: null,
        featured: Boolean(form.featured),
        popular: Boolean(form.popular),
        isNew: Boolean(form.isNew),
        isActive: form.isActive !== false,
        soldOut: Boolean(form.soldOut),
        specifications: specs,
      };
      if (newImageIds.length) {
        payload.imageIds = newImageIds;
      }

      if (isNew) return productsApi.create(payload);
      return productsApi.update(productId!, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      if (productId) {
        qc.invalidateQueries({ queryKey: ["product", productId] });
      }
      toast.success(isNew ? "Product created successfully" : "Product saved successfully");
      router.push(listHref);
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

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
        <Button variant="outline" onClick={() => router.push(listHref)}>
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
            <div className="relative">
              <Input
                value={String(form.name ?? "")}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  checkProductName(e.target.value);
                }}
              />
              {nameStatus === "new" && (
                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> New item
                </span>
              )}
              {nameStatus === "exists" && (
                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-medium text-red-600">
                  <XCircle className="h-4 w-4" /> Item already exists
                </span>
              )}
              {nameStatus === "checking" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  Checking…
                </span>
              )}
            </div>
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
            <Label>Min Price (USD) *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={String(form.minPrice ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  minPrice: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max Price (USD) *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={String(form.maxPrice ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxPrice: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Unit *</Label>
            <Input
              placeholder="e.g. kg, box, carton"
              value={String(form.unit ?? "")}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>MOQ *</Label>
            <Input
              type="number"
              min={1}
              value={String(form.moq ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  moq: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            {form.unit ? (
              <p className="text-xs text-muted">
                Minimum order quantity in {String(form.unit)}
              </p>
            ) : null}
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
                setForm({ ...form, categoryId: e.target.value })
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
          additionalImages={additionalImages}
          newImageIds={newImageIds}
          onDisplayChange={setDisplayImage}
          onAdditionalChange={setAdditionalImages}
          onNewIdsChange={setNewImageIds}
          onUploadingChange={setImageUploading}
        />
        {newImageIds.length > 0 && (
          <p className="mt-4 text-sm text-primary">
            {newImageIds.length} new image(s) will be linked when you save.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || imageUploading}
        >
          {imageUploading
            ? "Uploading…"
            : save.isPending
              ? "Saving..."
              : "Save Product"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (!requestClose()) return;
            router.push(listHref);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
