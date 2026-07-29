"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Upload, X, XCircle } from "lucide-react";
import { Label } from "@/components/ui/input";
import { uploadCategoryImage, storageUrl } from "@/lib/api/client";
import { UploadingOverlay } from "@/components/admin/uploading-overlay";
import { cn } from "@/lib/utils";

interface CategoryImageUploaderProps {
  value?: string;
  imageUrl?: string;
  categoryId?: string;
  label?: string;
  onChange: (path: string, url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
}

export function CategoryImageUploader({
  value,
  imageUrl,
  categoryId,
  label = "Category Image",
  onChange,
  onUploadingChange,
  className,
}: CategoryImageUploaderProps) {
  const [preview, setPreview] = useState(
    imageUrl ? storageUrl(imageUrl) : value ? storageUrl(value) : "",
  );
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    onUploadingChange?.(loading);
  }, [loading, onUploadingChange]);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError("");
      setUploadStatus("idle");
      try {
        const result = await uploadCategoryImage(file, categoryId);
        const url = storageUrl(result.url);
        setPreview(url);
        onChange(result.path, url);
        setUploadStatus("success");
      } catch {
        setUploadStatus("error");
        setError("Image upload failed. Please check your file and try again.");
      } finally {
        setLoading(false);
      }
    },
    [categoryId, onChange],
  );

  return (
    <div className={cn("relative space-y-2", className)}>
      <Label>{label}</Label>
      <div className="relative flex items-start gap-3">
        <label
          className={cn(
            "relative flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-white",
            loading ? "pointer-events-none" : "cursor-pointer hover:border-primary/40",
          )}
        >
          <Upload className="h-5 w-5 text-muted" />
          <span className="mt-1 text-[10px] text-muted">Upload</span>
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
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
            <Image
              src={preview}
              alt="Category"
              fill
              className="object-cover"
              unoptimized
            />
            {!loading && (
              <button
                type="button"
                onClick={() => {
                  setPreview("");
                  onChange("", "");
                  setUploadStatus("idle");
                }}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        {uploadStatus === "success" && !loading && (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Uploaded
          </div>
        )}
        {uploadStatus === "error" && !loading && (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <XCircle className="h-5 w-5" />
            Failed
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
