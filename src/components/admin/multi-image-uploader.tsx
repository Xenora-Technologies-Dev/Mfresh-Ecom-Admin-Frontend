"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { uploadImage, deleteImage, storageUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  id: string;
  type: string;
  urls: {
    display: string;
    thumbnail: string;
    medium: string;
    large: string;
  };
}

interface MultiImageUploaderProps {
  label?: string;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  onNewIds?: (ids: string[]) => void;
  newImageIds?: string[];
  className?: string;
}

export function MultiImageUploader({
  label = "Product Images",
  images,
  onChange,
  onNewIds,
  newImageIds = [],
  className,
}: MultiImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;

      setLoading(true);
      setError("");
      const added: UploadedImage[] = [];
      const addedIds: string[] = [];

      try {
        for (const file of list) {
          const result = await uploadImage(file, "DISPLAY", true);
          const img: UploadedImage = {
            id: result.id,
            type: result.type,
            urls: {
              display: storageUrl(result.urls.display),
              thumbnail: storageUrl(result.urls.thumbnail),
              medium: storageUrl(result.urls.medium),
              large: storageUrl(result.urls.large),
            },
          };
          added.push(img);
          addedIds.push(result.id);
        }
        onChange([...images, ...added]);
        onNewIds?.([...newImageIds, ...addedIds]);
      } catch {
        setError("Upload failed. Check backend and R2/storage configuration.");
      } finally {
        setLoading(false);
      }
    },
    [images, newImageIds, onChange, onNewIds],
  );

  const remove = async (img: UploadedImage) => {
    const isNew = newImageIds.includes(img.id);
    if (isNew) {
      try {
        await deleteImage(img.id);
      } catch {
        /* ignore */
      }
      onNewIds?.(newImageIds.filter((id) => id !== img.id));
    } else {
      try {
        await deleteImage(img.id);
      } catch {
        setError("Failed to remove image.");
        return;
      }
    }
    onChange(images.filter((i) => i.id !== img.id));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>{label}</Label>

      <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white transition-colors hover:border-primary/40">
        <Upload className="mb-2 h-6 w-6 text-muted" />
        <span className="text-xs text-muted">
          {loading ? "Uploading..." : "Click or drop images (multiple allowed)"}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) void handleFiles(files);
            e.target.value = "";
          }}
        />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-background"
            >
              <Image
                src={img.urls.display}
                alt="Product"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => void remove(img)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-sm text-muted">
          {images.length} image{images.length !== 1 ? "s" : ""} attached
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
