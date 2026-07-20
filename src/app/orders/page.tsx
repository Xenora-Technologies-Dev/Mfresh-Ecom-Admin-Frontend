"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Search, X, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ordersApi, type Order, type OrderKind } from "@/lib/api";
import { storageUrl } from "@/lib/api/client";
import { cn, formatApiError, formatDate } from "@/lib/utils";
import { toast } from "sonner";

function statusClass(status: string) {
  switch (status) {
    case "PLACED":
      return "bg-sky-100 text-sky-800";
    case "UNDER_VERIFICATION":
      return "bg-amber-100 text-amber-800";
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function kindLabel(kind: OrderKind) {
  return kind === "SELLER_LISTING" ? "Seller listing" : "Buyer order";
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [remarks, setRemarks] = useState("");
  const [confirmAction, setConfirmAction] = useState<"VERIFIED" | "REJECTED" | null>(
    null,
  );

  const reviewMutation = useMutation({
    mutationFn: (status: "VERIFIED" | "REJECTED") =>
      ordersApi.review(order.id, { status, remarks: remarks.trim() || undefined }),
    onSuccess: (updated) => {
      toast.success(
        updated.status === "VERIFIED" ? "Listing verified" : "Listing rejected",
      );
      void qc.invalidateQueries({ queryKey: ["orders"] });
      setConfirmAction(null);
      onClose();
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const isListing = order.kind === "SELLER_LISTING";
  const canReview =
    isListing && order.status === "UNDER_VERIFICATION" && !confirmAction;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {kindLabel(order.kind)}
            </p>
            <h2 className="text-xl font-bold text-foreground">{order.orderNumber}</h2>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                statusClass(order.status),
              )}
            >
              {order.status.replaceAll("_", " ")}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-light-gray"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">User details</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="font-medium">{order.userName}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="font-medium">{order.userEmail}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone / WhatsApp</dt>
                <dd className="font-medium">{order.userPhone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Company</dt>
                <dd className="font-medium">{order.userCompany || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Country</dt>
                <dd className="font-medium">{order.userCountry || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Placed</dt>
                <dd className="font-medium">{formatDate(order.createdAt)}</dd>
              </div>
            </dl>
          </section>

          {isListing ? (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Product submission
              </h3>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-light-gray sm:w-36">
                  {order.productImage ? (
                    <Image
                      src={storageUrl(order.productImage)}
                      alt={order.productName ?? "Product"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                      No image
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                  <p className="text-lg font-semibold">{order.productName}</p>
                  {order.productDescription && (
                    <p className="text-muted">{order.productDescription}</p>
                  )}
                  <p>
                    <span className="text-muted">Origin:</span>{" "}
                    {order.productOrigin || "—"}
                  </p>
                  <p>
                    <span className="text-muted">MOQ:</span>{" "}
                    {order.productMoq ?? "—"} {order.productMoqUnit ?? ""}
                  </p>
                  <p>
                    <span className="text-muted">Price:</span>{" "}
                    {order.productPrice != null
                      ? `${order.productCurrency ?? "USD"} ${order.productPrice}`
                      : "—"}
                  </p>
                </div>
              </div>
              {order.remarks && (
                <p className="mt-3 rounded-lg bg-light-gray px-3 py-2 text-sm">
                  <span className="font-medium">Remarks:</span> {order.remarks}
                </p>
              )}
            </section>
          ) : (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Order items ({order.items.length})
              </h3>
              <ul className="space-y-3">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-light-gray">
                      {item.productImage ? (
                        <Image
                          src={storageUrl(item.productImage)}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted">
                        Qty: {item.quantity} {item.moqUnit}
                      </p>
                      <p className="text-sm font-semibold">
                        {item.currency} {item.price}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(canReview || confirmAction) && (
            <section className="border-t border-border pt-4">
              <h3 className="mb-2 text-sm font-semibold">Verification</h3>
              {confirmAction ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="remarks">
                      Remarks{" "}
                      {confirmAction === "REJECTED" ? "(recommended)" : "(optional)"}
                    </Label>
                    <textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Add a note for the seller…"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={confirmAction === "VERIFIED" ? "default" : "destructive"}
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate(confirmAction)}
                    >
                      {reviewMutation.isPending
                        ? "Saving…"
                        : confirmAction === "VERIFIED"
                          ? "Confirm verify"
                          : "Confirm reject"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConfirmAction(null);
                        setRemarks("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="gap-1.5"
                    onClick={() => setConfirmAction("VERIFIED")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => setConfirmAction("REJECTED")}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [kind, setKind] = useState<"" | OrderKind>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: selectedDetail } = useQuery({
    queryKey: ["order", selectedId],
    queryFn: () => ordersApi.get(selectedId!),
    enabled: Boolean(selectedId),
  });

  const selected = selectedDetail ?? null;

  const listParams = useMemo(
    () => ({
      page,
      limit: 20,
      search,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      ...(kind ? { kind } : {}),
    }),
    [page, search, kind],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["orders", listParams],
    queryFn: () => ordersApi.list(listParams),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Orders</h2>
        <p className="mt-1 text-sm text-muted">
          Buyer cart orders and seller product submissions awaiting review.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order #, name, email…"
            className="pl-10"
          />
        </form>
        <div className="flex gap-2">
          {(
            [
              { id: "", label: "All" },
              { id: "BUYER_ORDER", label: "Buyer" },
              { id: "SELLER_LISTING", label: "Seller" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id || "all"}
              type="button"
              onClick={() => {
                setKind(opt.id);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                kind === opt.id
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-muted hover:bg-light-gray",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-light-gray/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    Loading orders…
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
              {rows.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-muted">{kindLabel(order.kind)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.userName}</div>
                    <div className="text-xs text-muted">{order.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    {order.kind === "BUYER_ORDER"
                      ? order.items.length
                      : order.productName
                        ? 1
                        : 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        statusClass(order.status),
                      )}
                    >
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setSelectedId(order.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedId && selected && (
        <OrderDetailModal order={selected} onClose={() => setSelectedId(null)} />
      )}
      {selectedId && !selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
