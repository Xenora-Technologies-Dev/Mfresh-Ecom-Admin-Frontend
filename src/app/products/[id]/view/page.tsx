"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/lib/api";
import { storageUrl } from "@/lib/api/client";
import { formatApiError, formatPriceUsd } from "@/lib/utils";

export default function ProductViewPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const productId = params.id as string;

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.get(productId),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      productsApi.update(productId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  if (isLoading) {
    return <p className="p-8 text-muted">Loading product...</p>;
  }

  if (!product) {
    return <p className="p-8 text-muted">Product not found.</p>;
  }

  const images =
    (product.imageUrls as { display?: string }[])?.map((img) =>
      storageUrl(img.display ?? ""),
    ) ?? [];

  const isActive = product.isActive !== false;
  const soldOut = Boolean(product.soldOut);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{product.name as string}</h2>
          <p className="text-muted">Product details and availability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${productId}`}>Edit</Link>
          </Button>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {images.map((url, i) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No images</p>
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-white p-6">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted">Price</dt>
              <dd className="font-semibold">
                {formatPriceUsd(Number(product.price))}
              </dd>
            </div>
            <div>
              <dt className="text-muted">MOQ</dt>
              <dd>
                {product.moq as number} {product.moqUnit as string}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Country</dt>
              <dd>{(product.country as string) ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Category</dt>
              <dd>
                {(product.category as { name?: string })?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Supplier</dt>
              <dd>
                {(product.supplier as { name?: string })?.name ?? "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Description</dt>
              <dd className="mt-1 text-dark-gray">
                {(product.description as string) ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="space-y-3 border-t border-border pt-4">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="font-medium">Disable product</p>
                <p className="text-xs text-muted">
                  Hides product from the storefront
                </p>
              </div>
              <input
                type="checkbox"
                checked={!isActive}
                onChange={(e) =>
                  updateMutation.mutate({ isActive: !e.target.checked })
                }
                disabled={updateMutation.isPending}
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="font-medium">Mark as sold out</p>
                <p className="text-xs text-muted">
                  Shows sold out on the storefront
                </p>
              </div>
              <input
                type="checkbox"
                checked={soldOut}
                onChange={(e) =>
                  updateMutation.mutate({ soldOut: e.target.checked })
                }
                disabled={updateMutation.isPending || !isActive}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
