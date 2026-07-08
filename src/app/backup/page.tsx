"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backupApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function BackupPage() {
  const qc = useQueryClient();
  const { data: backups, isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: () => backupApi.list(),
  });

  const createBackup = useMutation({
    mutationFn: () => backupApi.create(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
  });

  const restoreBackup = useMutation({
    mutationFn: (filename: string) => backupApi.restore(filename),
    onSuccess: () => {
      alert("Restore completed successfully");
      qc.invalidateQueries();
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Backup & Restore</h2>
        <p className="text-muted">
          Export and restore all marketplace data as JSON backups
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Create Backup</h3>
            <p className="text-sm text-muted">
              Export categories, products, suppliers, customers, banners, and settings
            </p>
          </div>
          <Button
            onClick={() => createBackup.mutate()}
            disabled={createBackup.isPending}
          >
            <Download className="h-4 w-4" />
            {createBackup.isPending ? "Creating..." : "Create Backup"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold">Available Backups</h3>
        </div>
        {isLoading ? (
          <p className="p-6 text-muted">Loading...</p>
        ) : !backups?.length ? (
          <p className="p-6 text-muted">No backups yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {backups.map((b) => (
              <li
                key={b.filename}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium">{b.filename}</p>
                  <p className="text-sm text-muted">
                    {formatDate(b.createdAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        "Restore will replace all current data. Continue?",
                      )
                    )
                      restoreBackup.mutate(b.filename);
                  }}
                  disabled={restoreBackup.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
