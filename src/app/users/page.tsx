"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Mail, Shield, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import {
  inviteAdmin,
  listPortalAdmins,
  revokeAdminInvitation,
} from "./_actions";

export default function UsersPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["portal-admins"],
    queryFn: async () => {
      const res = await listPortalAdmins();
      if (!res.ok) throw new Error(res.error);
      return res;
    },
  });

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("email", email);
    formData.set("role", "admin");

    startTransition(async () => {
      const res = await inviteAdmin(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Invitation sent to ${res.email}`);
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["portal-admins"] });
    });
  };

  const onRevoke = (invitationId: string) => {
    if (!confirm("Revoke this invitation? The invite link will stop working.")) return;
    setRevokingId(invitationId);
    startTransition(async () => {
      const res = await revokeAdminInvitation(invitationId);
      setRevokingId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Invitation revoked");
      await qc.invalidateQueries({ queryKey: ["portal-admins"] });
    });
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Users</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Invite operations admins to the MFresh portal. The first admin is set up
            in Clerk; additional admins are invited from here and receive an email
            automatically.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <section className="rounded-xl border border-border bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Invite admin</h3>
            <p className="text-xs text-muted">Role is fixed to Admin for dashboard invites.</p>
          </div>
        </div>

        <form onSubmit={onInvite} className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              placeholder="ops@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <div className="relative">
              <select
                id="invite-role"
                name="role"
                value="admin"
                disabled
                className="flex h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="admin">Admin</option>
              </select>
              <Shield className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-600" />
            </div>
          </div>
          <Button type="submit" disabled={pending || !email.trim()}>
            <Mail className="h-4 w-4" />
            {pending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Active admins</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && (data?.admins.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No active admins yet. Set the first admin in Clerk, then invite more here.
                  </td>
                </tr>
              )}
              {data?.admins.map((admin) => (
                <tr key={admin.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{admin.name}</td>
                  <td className="px-4 py-3 text-muted">{admin.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      Admin
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(new Date(admin.createdAt).toISOString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Pending invitations</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && (data?.invitations.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No pending admin invitations.
                  </td>
                </tr>
              )}
              {data?.invitations.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{inv.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      Admin
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(new Date(inv.createdAt).toISOString())}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={pending && revokingId === inv.id}
                      onClick={() => onRevoke(inv.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
