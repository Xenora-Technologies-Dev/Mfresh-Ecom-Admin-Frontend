"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  Mail,
  MailOpen,
  Search,
  Trash2,
  ArrowLeft,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leadsApi } from "@/lib/api";
import { storageUrl } from "@/lib/api/client";
import { formatApiError, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  MESSAGE_TYPE_FILTERS,
  type LeadRecord,
  leadPreview,
  leadSubjectLine,
  leadTypeLabel,
  markMessagesSectionSeen,
  parseLeadPayload,
} from "@/lib/messages";

function asLead(row: Record<string, unknown>): LeadRecord {
  return {
    id: String(row.id),
    type: String(row.type ?? ""),
    contactName: String(row.contactName ?? ""),
    email: String(row.email ?? ""),
    businessName: (row.businessName as string) ?? null,
    phone: (row.phone as string) ?? null,
    businessType: (row.businessType as string) ?? null,
    country: (row.country as string) ?? null,
    subject: (row.subject as string) ?? null,
    message: (row.message as string) ?? null,
    isRead: Boolean(row.isRead),
    readAt: (row.readAt as string) ?? null,
    createdAt: String(row.createdAt ?? ""),
  };
}

export default function MessagesPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get("type") ?? "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState(typeFromUrl);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setType(typeFromUrl);
    setPage(1);
  }, [typeFromUrl]);

  useEffect(() => {
    markMessagesSectionSeen();
    void qc.invalidateQueries({ queryKey: ["messages-unread"] });
  }, [qc]);

  const listParams = useMemo(
    () => ({
      page,
      limit: 25,
      search,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      ...(type ? { type } : {}),
      ...(unreadOnly ? { isRead: "false" } : {}),
    }),
    [page, search, type, unreadOnly],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["messages", listParams],
    queryFn: () => leadsApi.list(listParams),
  });

  const items = (data?.data ?? []).map(asLead);
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const selected = items.find((m) => m.id === selectedId) ?? null;

  const { data: selectedDetail } = useQuery({
    queryKey: ["message", selectedId],
    queryFn: () => leadsApi.get(selectedId!),
    enabled: Boolean(selectedId),
  });

  const detail = selectedDetail ? asLead(selectedDetail) : selected;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => leadsApi.markRead(id, true),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages"] });
      void qc.invalidateQueries({ queryKey: ["messages-unread"] });
      void qc.invalidateQueries({ queryKey: ["message"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => leadsApi.markAllRead(),
    onSuccess: (res) => {
      toast.success(
        res.updated ? `Marked ${res.updated} as read` : "All caught up",
      );
      void qc.invalidateQueries({ queryKey: ["messages"] });
      void qc.invalidateQueries({ queryKey: ["messages-unread"] });
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => {
      toast.success("Message deleted");
      setSelectedId(null);
      void qc.invalidateQueries({ queryKey: ["messages"] });
      void qc.invalidateQueries({ queryKey: ["messages-unread"] });
    },
    onError: (err) => toast.error(formatApiError(err)),
  });

  const openMessage = (lead: LeadRecord) => {
    setSelectedId(lead.id);
    if (!lead.isRead) markReadMutation.mutate(lead.id);
  };

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const payload = detail ? parseLeadPayload(detail.message) : {};

  return (
    <div className="-mx-2 flex h-[calc(100dvh-7.5rem)] min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:-mx-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-dark-gray sm:text-lg">
            Messages
          </h2>
        </div>

        <form
          onSubmit={applySearch}
          className="order-last flex w-full min-w-0 flex-1 items-center gap-2 sm:order-none sm:mx-4 sm:max-w-md"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search mail"
              className="h-9 pl-9"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-9">
            Search
          </Button>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 text-xs"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-[#f6f8fc] px-3 py-2 sm:px-4">
        {MESSAGE_TYPE_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => {
              setType(f.value);
              setPage(1);
              setSelectedId(null);
            }}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition",
              type === f.value
                ? "bg-primary text-white"
                : "bg-white text-dark-gray ring-1 ring-border hover:bg-light-gray",
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setUnreadOnly((v) => !v);
            setPage(1);
          }}
          className={cn(
            "ml-auto rounded-full px-2.5 py-1 text-xs font-medium transition",
            unreadOnly
              ? "bg-red-500 text-white"
              : "bg-white text-dark-gray ring-1 ring-border hover:bg-light-gray",
          )}
        >
          Unread
        </button>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,420px)_1fr]">
        {/* List */}
        <div
          className={cn(
            "min-h-0 overflow-y-auto border-border lg:border-r",
            selectedId ? "hidden lg:block" : "block",
          )}
        >
          {isLoading ? (
            <p className="p-6 text-sm text-muted">Loading messages…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Mail className="mb-3 h-10 w-10 text-muted/40" />
              <p className="font-medium text-dark-gray">No messages</p>
              <p className="mt-1 text-sm text-muted">
                Form submissions from the storefront will appear here.
              </p>
            </div>
          ) : (
            <ul>
              {items.map((lead) => {
                const active = lead.id === selectedId;
                const unread = !lead.isRead;
                return (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(lead)}
                      className={cn(
                        "flex w-full gap-3 border-b border-border px-3 py-3 text-left transition sm:px-4",
                        active ? "bg-[#c2e7ff]/50" : "hover:bg-[#f2f6fc]",
                        unread && !active && "bg-white",
                      )}
                    >
                      <span className="mt-1.5 shrink-0">
                        {unread ? (
                          <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-sm text-dark-gray",
                              unread ? "font-bold" : "font-medium",
                            )}
                          >
                            {lead.contactName || lead.email}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted">
                            {formatDate(lead.createdAt)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block truncate text-sm text-dark-gray",
                            unread ? "font-semibold" : "font-normal",
                          )}
                        >
                          {leadSubjectLine(lead)}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          <span className="mr-1.5 inline-flex rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                            {leadTypeLabel(lead.type)}
                          </span>
                          {leadPreview(lead)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Detail */}
        <div
          className={cn(
            "min-h-0 overflow-y-auto bg-white",
            selectedId ? "block" : "hidden lg:block",
          )}
        >
          {!detail ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-20 text-center text-muted">
              <Mail className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">Select a message to read it</p>
            </div>
          ) : (
            <article className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex items-start gap-2 lg:hidden">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-snug text-dark-gray sm:text-xl">
                    {leadSubjectLine(detail)}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(detail.createdAt)}
                    {detail.isRead ? " · Read" : " · Unread"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    if (confirm("Delete this message?")) {
                      deleteMutation.mutate(detail.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {(detail.contactName || detail.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-dark-gray">
                    {detail.contactName || "—"}
                  </p>
                  <p className="truncate text-sm text-muted">
                    &lt;{detail.email}&gt;
                    {detail.phone ? ` · ${detail.phone}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary">
                  {leadTypeLabel(detail.type)}
                </span>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {detail.businessName && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Company
                    </dt>
                    <dd className="text-sm text-dark-gray">{detail.businessName}</dd>
                  </div>
                )}
                {detail.country && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Country
                    </dt>
                    <dd className="text-sm text-dark-gray">{detail.country}</dd>
                  </div>
                )}
                {detail.businessType && detail.type !== "distribution" && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Business type
                    </dt>
                    <dd className="text-sm text-dark-gray">{detail.businessType}</dd>
                  </div>
                )}
              </dl>

              {detail.type === "distribution" && (
                <div className="mt-6 space-y-3 rounded-xl border border-border bg-[#f8fafc] p-4">
                  <p className="text-sm">
                    <span className="font-semibold text-dark-gray">Brand / interest: </span>
                    {(payload.interestLabel as string) ||
                      (payload.interest as string) ||
                      "—"}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-dark-gray">Territory: </span>
                    {(payload.territory as string) || "—"}
                  </p>
                  {(payload.note as string) && (
                    <p className="text-sm whitespace-pre-wrap text-dark-gray">
                      {String(payload.note)}
                    </p>
                  )}
                </div>
              )}

              {detail.type === "quote" && (
                <div className="mt-6 space-y-4">
                  {payload.product && typeof payload.product === "object" && (
                    <div className="flex gap-3 rounded-xl border border-border p-3">
                      {(payload.product as { image?: string }).image && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-light-gray">
                          <Image
                            src={storageUrl(
                              String((payload.product as { image: string }).image),
                            )}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-dark-gray">
                          {(payload.product as { name?: string }).name}
                        </p>
                        <p className="text-xs text-muted">
                          {(payload.product as { categoryName?: string }).categoryName}
                          {" · "}
                          {(payload.product as { country?: string }).country}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="text-sm">
                      <span className="font-semibold">Quantity: </span>
                      {String(payload.quantity ?? "—")}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Target price: </span>
                      {String(payload.targetPrice ?? "—")}
                    </p>
                  </div>
                  {(payload.note as string) && (
                    <p className="whitespace-pre-wrap rounded-xl border border-border bg-[#f8fafc] p-4 text-sm">
                      {String(payload.note)}
                    </p>
                  )}
                </div>
              )}

              {detail.type === "wishlist" && (
                <div className="mt-6 space-y-2">
                  {Array.isArray(payload.products) &&
                    (payload.products as { name?: string; price?: number; currency?: string; country?: string }[]).map(
                      (p, i) => (
                        <div
                          key={`${p.name}-${i}`}
                          className="rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-dark-gray">{p.name}</span>
                          <span className="text-muted">
                            {" · "}
                            {p.currency} {p.price}
                            {p.country ? ` · ${p.country}` : ""}
                          </span>
                        </div>
                      ),
                    )}
                </div>
              )}

              {(detail.type === "contact" ||
                detail.type === "buyer" ||
                detail.type === "seller" ||
                detail.type === "newsletter") &&
                detail.message &&
                !detail.message.trim().startsWith("{") && (
                  <div className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-[#f8fafc] p-4 text-sm leading-relaxed text-dark-gray">
                    {detail.message}
                  </div>
                )}

              {detail.subject && detail.type === "contact" && (
                <p className="mt-4 text-sm text-muted">
                  Subject field: {detail.subject}
                </p>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
