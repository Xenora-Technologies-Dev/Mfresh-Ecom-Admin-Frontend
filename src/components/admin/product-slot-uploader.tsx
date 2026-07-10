"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ImageIcon, Upload, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/input";
import { uploadImage, deleteImage, storageUrl } from "@/lib/api/client";
import { formatApiError } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UploadedImage } from "@/components/admin/multi-image-uploader";

type ImageSlotType = "DISPLAY" | "MAIN" | "SUB";

interface ProductSlotUploaderProps {
  label: string;
  hint: string;
  imageType: ImageSlotType;
  value?: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  onNewId?: (id: string | null) => void;
  isNewUpload?: boolean;
  aspectClass?: string;
  className?: string;
}

export function ProductSlotUploader({
  label,
  hint,
  imageType,
  value,
  onChange,
  onNewId,
  isNewUpload,
  aspectClass = "aspect-[4/3]",
  className,
}: ProductSlotUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const preview = value?.urls.large || value?.urls.display || "";

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose a valid image file (JPG, PNG, or WebP).");
        return;
      }
      setLoading(true);
      setStatus("idle");
      const previous = value;
      try {
        const result = await uploadImage(file, imageType, true);
        const img: UploadedImage = {
          id: result.id,
          type: result.type,
          urls: {
            display: storageUrl(result.urls.display),
            thumbnail: storageUrl(result.urls.thumbnail),
            medium: storageUrl(result.urls.medium),
            large: storageUrl(result.urls.large),
          },
          uploadStatus: "success",
        };
        // Replace previous slot image so only one DISPLAY/MAIN remains
        if (previous?.id && previous.id !== result.id) {
          try {
            await deleteImage(previous.id);
          } catch {
            /* previous may already be gone */
          }
        }
        onChange(img);
        onNewId?.(result.id);
        setStatus("success");
        toast.success(
          previous
            ? `${label} replaced successfully`
            : `${label} uploaded successfully`,
        );
      } catch (err) {
        setStatus("error");
        toast.error(`${label} upload failed: ${formatApiError(err)}`);
      } finally {
        setLoading(false);
      }
    },
    [imageType, label, onChange, onNewId, value],
  );

  const remove = async () => {
    if (!value) return;
    if (
      !confirm(
        `Remove this ${label.toLowerCase()}? You can upload a new one before saving.`,
      )
    )
      return;
    if (isNewUpload) {
      try {
        await deleteImage(value.id);
      } catch {
        /* ignore */
      }
      onNewId?.(null);
    } else {
      try {
        await deleteImage(value.id);
        toast.success(`${label} removed`);
      } catch (err) {
        toast.error(`Could not remove image: ${formatApiError(err)}`);
        return;
      }
    }
    onChange(null);
    setStatus("idle");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <label
          className={cn(
            "flex w-36 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white hover:border-primary/40",
            aspectClass,
          )}
        >
          <Upload className="h-5 w-5 text-muted" />
          <span className="mt-1 px-2 text-center text-[10px] text-muted">
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

        {preview ? (
          <div
            className={cn(
              "relative w-44 overflow-hidden rounded-xl border border-border",
              aspectClass,
            )}
          >
            <Image
              src={preview}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => void remove()}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              aria-label={`Remove ${label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex w-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-light-gray/40 text-muted",
              aspectClass,
            )}
          >
            <ImageIcon className="h-8 w-8 opacity-30" />
            <span className="mt-1 text-[10px]">No image</span>
          </div>
        )}

        {status === "success" && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" /> OK
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1 text-sm text-red-600">
            <XCircle className="h-4 w-4" /> Failed
          </span>
        )}
      </div>
    </div>
  );
}
