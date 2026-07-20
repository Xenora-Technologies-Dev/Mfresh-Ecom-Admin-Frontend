"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Label } from "@/components/ui/input";
import { uploadCategoryImage, storageUrl } from "@/lib/api/client";
import { UploadingOverlay } from "@/components/admin/uploading-overlay";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  value: string | null;
  onChange: (path: string | null, previewUrl: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
}

export function LogoUploader({
  value,
  onChange,
  onUploadingChange,
  className,
}: LogoUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const preview = value ? storageUrl(value) : null;

  useEffect(() => {
    onUploadingChange?.(loading);
  }, [loading, onUploadingChange]);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError("");
      try {
        const result = await uploadCategoryImage(file);
        onChange(result.path, storageUrl(result.path));
      } catch {
        setError("Upload failed. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    },
    [onChange],
  );

  return (
    <div className={cn("relative space-y-2", className)}>
      <Label>Custom Logo Image</Label>
      <div className="flex items-start gap-4">
        <label
          className={cn(
            "relative flex h-24 w-40 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-white transition-colors",
            loading ? "pointer-events-none" : "cursor-pointer hover:border-primary/40",
          )}
        >
          <Upload className="h-5 w-5 text-muted" />
          <span className="mt-1 text-[10px] text-muted">Upload logo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
          <UploadingOverlay show={loading} />
        </label>

        {preview && (
          <div className="relative flex h-24 w-40 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
            <Image
              src={preview}
              alt="Logo preview"
              width={140}
              height={48}
              className="max-h-full w-auto object-contain"
              unoptimized
            />
            {!loading && (
              <button
                type="button"
                onClick={() => onChange(null, null)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
                aria-label="Remove logo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-muted">PNG or SVG with transparent background works best.</p>
    </div>
  );
}
