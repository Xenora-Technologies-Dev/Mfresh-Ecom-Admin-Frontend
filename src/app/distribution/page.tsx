"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadsApi } from "@/lib/api";
import { formatDate, formatApiError } from "@/lib/utils";
import { toast } from "sonner";

type DistributionPayload = {
  kind?: string;
  interest?: string;
  interestLabel?: string;
  territory?: string;
  note?: string;
};

function parseDistribution(message?: string | null): DistributionPayload {
  if (!message) return {};
  try {
    return JSON.parse(message) as DistributionPayload;
  } catch {
    return { note: message };
  }
}

export default function DistributionLeadsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["distribution-leads", page],
    queryFn: () =>
      leadsApi.list({
        page,
        limit: 12,
        sortBy: "createdAt",
        sortOrder: "desc",
        type: "distribution",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => {
      toast.success("Entry removed");
      qc.invalidateQueries({ queryKey: ["distribution-leads"] });
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Distribution Forms</h2>
        <p className="text-muted">
          Partner requests from the storefront Distribution page (M Fresh food
          brand &amp; MR Fresh cleaning liquids).
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <Truck className="mx-auto mb-3 h-10 w-10 text-muted opacity-40" />
          <p className="font-medium text-dark-gray">No distribution requests yet</p>
          <p className="mt-1 text-sm text-muted">
            Submissions from /distribution will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((lead) => {
            const payload = parseDistribution(lead.message as string);

            return (
              <article
                key={lead.id as string}
                className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-dark-gray">
                      {String(lead.contactName ?? "—")}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(String(lead.createdAt ?? ""))}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted hover:text-red-600"
                    onClick={() => deleteMutation.mutate(String(lead.id))}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <p>
                    <span className="text-muted">Interest:</span>{" "}
                    <span className="font-medium text-primary">
                      {payload.interestLabel || String(lead.subject ?? "—")}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">Email:</span>{" "}
                    <a
                      href={`mailto:${String(lead.email ?? "")}`}
                      className="text-secondary hover:underline"
                    >
                      {String(lead.email ?? "—")}
                    </a>
                  </p>
                  {lead.phone ? (
                    <p>
                      <span className="text-muted">Phone:</span>{" "}
                      {String(lead.phone)}
                    </p>
                  ) : null}
                  {lead.businessName ? (
                    <p>
                      <span className="text-muted">Company:</span>{" "}
                      {String(lead.businessName)}
                    </p>
                  ) : null}
                  {lead.country ? (
                    <p>
                      <span className="text-muted">Country:</span>{" "}
                      {String(lead.country)}
                    </p>
                  ) : null}
                  {payload.territory ? (
                    <p>
                      <span className="text-muted">Territory:</span>{" "}
                      {payload.territory}
                    </p>
                  ) : null}
                  {payload.note ? (
                    <p className="mt-2 rounded-lg bg-light-gray/80 p-2.5 text-xs leading-relaxed text-dark-gray">
                      {payload.note}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
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
