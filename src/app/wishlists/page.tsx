"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { leadsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type WishlistPayload = {
  kind?: string;
  productIds?: string[];
  products?: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    currency: string;
    country: string;
    url?: string;
  }[];
};

function parseWishlist(message?: string | null): WishlistPayload {
  if (!message) return {};
  try {
    return JSON.parse(message) as WishlistPayload;
  } catch {
    return {};
  }
}

const columns: ColumnDef<Record<string, unknown>, unknown>[] = [
  {
    accessorKey: "contactName",
    header: "Name",
  },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "country", header: "Country" },
  {
    id: "company",
    header: "Company",
    cell: ({ row }) => (row.original.businessName as string) ?? "—",
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => {
      const data = parseWishlist(row.original.message as string);
      return data.products?.length ?? data.productIds?.length ?? 0;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
];

export default function WishlistsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);

  const params = { page, limit: 10, search, sortBy, sortOrder, type: "wishlist" };

  const { data, isLoading } = useQuery({
    queryKey: ["wishlists", params],
    queryFn: () => leadsApi.list(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlists"] });
      setViewing(null);
    },
  });

  const wishlistData = viewing
    ? parseWishlist(viewing.message as string)
    : null;

  return (
    <>
      <DataTable
        title="Wishlist Shares"
        columns={[
          {
            id: "type",
            header: "Type",
            cell: () => (
              <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pink-700">
                Wishlist
              </span>
            ),
          },
          ...columns,
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewing(row.original)}
                  aria-label="View"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this submission?"))
                      deleteMutation.mutate(row.original.id as string);
                  }}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ),
          },
        ]}
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
      />

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Wishlist Share Details</h3>
            <p className="mt-1 text-xs text-muted">
              This is a wishlist share — not a Quick Quote request.
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="font-medium">{viewing.contactName as string}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="font-medium">{viewing.email as string}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="font-medium">{(viewing.phone as string) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Country</dt>
                <dd className="font-medium">{(viewing.country as string) ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Company</dt>
                <dd className="font-medium">
                  {(viewing.businessName as string) ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Submitted</dt>
                <dd className="font-medium">
                  {formatDate(viewing.createdAt as string)}
                </dd>
              </div>
            </dl>

            <h4 className="mt-6 font-semibold">Products</h4>
            {wishlistData?.products?.length ? (
              <ul className="mt-3 space-y-2">
                {wishlistData.products.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted">
                      {" "}
                      — {p.currency} {p.price}
                      {p.country ? ` · ${p.country}` : ""}
                    </span>
                    {p.url || p.slug ? (
                      <a
                        href={p.url ?? `#`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-xs text-primary hover:underline"
                      >
                        {p.url ?? p.slug}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No product details recorded.</p>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setViewing(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
