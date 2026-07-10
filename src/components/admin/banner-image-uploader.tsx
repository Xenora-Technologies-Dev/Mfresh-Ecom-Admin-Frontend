"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Upload, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/input";
import { uploadBannerImage, storageUrl } from "@/lib/api/client";
import { formatApiError } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BannerImageUploaderProps {
  value?: string;
  imageUrl?: string;
  bannerId?: string;
  onChange: (path: string, url: string) => void;
  className?: string;
}

export function BannerImageUploader({
  value,
  imageUrl,
  bannerId,
  onChange,
  className,
}: BannerImageUploaderProps) {
  const [preview, setPreview] = useState(
    imageUrl ? storageUrl(imageUrl) : value ? storageUrl(value) : "",
  );
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        const msg = "Please choose a valid image file (JPG, PNG, or WebP).";
        setError(msg);
        setUploadStatus("error");
        toast.error(msg);
        return;
      }

      setLoading(true);
      setError("");
      setUploadStatus("idle");
      try {
        const result = await uploadBannerImage(file, bannerId);
        const url = storageUrl(result.url);
        setPreview(url);
        onChange(result.path, url);
        setUploadStatus("success");
        toast.success("Banner image uploaded successfully");
      } catch (err) {
        const msg = formatApiError(err);
        setUploadStatus("error");
        setError(msg);
        toast.error(`Image upload failed: ${msg}`);
      } finally {
        setLoading(false);
      }
    },
    [bannerId, onChange],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Banner Image</Label>
      <p className="text-xs text-muted">
        Recommended: wide image (1920×800). Used on the storefront hero and promo sections.
      </p>
      <div className="flex items-start gap-3">
        <label className="flex h-24 w-32 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white hover:border-primary/40">
          <Upload className="h-5 w-5 text-muted" />
          <span className="mt-1 text-[10px] text-muted">
            {loading ? "Uploading…" : "Upload"}
          </span>
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
        </label>
        {preview && (
          <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-border">
            <Image
              src={preview}
              alt="Banner preview"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => {
                setPreview("");
                onChange("", "");
                setUploadStatus("idle");
                setError("");
              }}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {uploadStatus === "success" && (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Uploaded
          </div>
        )}
        {uploadStatus === "error" && (
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
