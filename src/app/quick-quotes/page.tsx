"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadsApi } from "@/lib/api";
import { formatDate, formatApiError } from "@/lib/utils";
import { storageUrl } from "@/lib/api/client";
import { toast } from "sonner";

type QuotePayload = {
  firstName?: string;
  lastName?: string;
  dialCode?: string;
  phone?: string;
  quantity?: string;
  targetPrice?: string;
  note?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    moq: number;
    moqUnit: string;
    country: string;
    image: string;
    categoryName: string;
  };
};

function parseQuote(message?: string | null): QuotePayload {
  if (!message) return {};
  try {
    return JSON.parse(message) as QuotePayload;
  } catch {
    return {};
  }
}

export default function QuickQuotesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["quick-quotes", page],
    queryFn: () =>
      leadsApi.list({
        page,
        limit: 12,
        sortBy: "createdAt",
        sortOrder: "desc",
        type: "quote",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => {
      toast.success("Quote removed");
      qc.invalidateQueries({ queryKey: ["quick-quotes"] });
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quick Quotes</h2>
        <p className="text-muted">
          Product quote requests from the storefront Quick Quote form. These are
          separate from Wishlist Shares.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading quotes…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted opacity-40" />
          <p className="font-medium text-dark-gray">No quick quotes yet</p>
          <p className="mt-1 text-sm text-muted">
            When buyers submit a Quick Quote on a product, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((lead) => {
            const quote = parseQuote(lead.message as string);
            const product = quote.product;
            const img = product?.image ? storageUrl(product.image) : "";

            return (
              <article
                key={lead.id as string}
                className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm"
              >
                <div className="border-b border-border bg-sky-50/80 px-4 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                    Quick Quote
                  </span>
                </div>
                <div className="flex gap-3 border-b border-border bg-gray-50 p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    {img ? (
                      <Image
                        src={img}
                        alt={product?.name ?? "Product"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-dark-gray">
                      {product?.name ?? (lead.subject as string) ?? "Product"}
                    </p>
                    <p className="text-xs text-muted">
                      {product?.categoryName ?? "—"}
                      {product?.country ? ` · ${product.country}` : ""}
                    </p>
                    {product && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        {product.currency} {product.price} / {product.moqUnit}
                        {product.moq ? ` · MOQ ${product.moq}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2 p-4 text-sm">
                  <p>
                    <span className="font-medium">Contact:</span>{" "}
                    {(lead.contactName as string) || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {(lead.email as string) || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {(lead.phone as string) || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Company:</span>{" "}
                    {(lead.businessName as string) || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Quantity:</span>{" "}
                    {quote.quantity ? `${quote.quantity} Tonne` : "—"}
                  </p>
                  <p>
                    <span className="font-medium">Target Price:</span>{" "}
                    {quote.targetPrice ? `$${quote.targetPrice}` : "—"}
                  </p>
                  {quote.note ? (
                    <p className="rounded-lg bg-gray-50 p-2 text-xs text-muted">
                      {quote.note}
                    </p>
                  ) : null}
                  <p className="pt-1 text-xs text-muted">
                    Submitted {formatDate(lead.createdAt as string)}
                  </p>
                </div>

                <div className="border-t border-border px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-600"
                    onClick={() => {
                      if (confirm("Delete this quote request?")) {
                        deleteMutation.mutate(lead.id as string);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
