"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/input";
import { uploadImage, deleteImage, storageUrl } from "@/lib/api/client";
import { UploadingOverlay } from "@/components/admin/uploading-overlay";
import { formatApiError, cn } from "@/lib/utils";
import type { UploadedImage } from "@/components/admin/multi-image-uploader";

interface ProductAdditionalImagesUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  newImageIds: string[];
  onNewIds: (ids: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}

export function ProductAdditionalImagesUploader({
  images,
  onChange,
  newImageIds,
  onNewIds,
  onUploadingChange,
  disabled = false,
}: ProductAdditionalImagesUploaderProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onUploadingChange?.(loading);
  }, [loading, onUploadingChange]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled) {
        toast.error("Add a display image before uploading additional images.");
        return;
      }
      const list = Array.from(files);
      if (!list.length) return;
      setLoading(true);
      const added: UploadedImage[] = [];
      const addedIds: string[] = [];
      let failures = 0;

      for (const file of list) {
        if (!file.type.startsWith("image/")) {
          failures++;
          continue;
        }
        try {
          const result = await uploadImage(file, "ADDITIONAL", true);
          added.push({
            id: result.id,
            type: "ADDITIONAL",
            urls: {
              display: storageUrl(result.urls.display),
              thumbnail: storageUrl(result.urls.thumbnail),
              medium: storageUrl(result.urls.medium),
              large: storageUrl(result.urls.large),
            },
            uploadStatus: "success",
          });
          addedIds.push(result.id);
        } catch {
          failures++;
        }
      }

      if (added.length) {
        onChange([...images, ...added]);
        onNewIds([...newImageIds, ...addedIds]);
        toast.success(
          `${added.length} additional image${added.length > 1 ? "s" : ""} uploaded`,
        );
      }
      if (failures) {
        toast.error(
          `${failures} file(s) could not be uploaded. Check format and try again.`,
        );
      }
      setLoading(false);
    },
    [disabled, images, newImageIds, onChange, onNewIds],
  );

  const remove = async (img: UploadedImage) => {
    if (loading) return;
    if (!confirm("Remove this additional image?")) return;
    try {
      await deleteImage(img.id);
      if (newImageIds.includes(img.id)) {
        onNewIds(newImageIds.filter((id) => id !== img.id));
      }
      onChange(images.filter((i) => i.id !== img.id));
      toast.success("Additional image removed");
    } catch (err) {
      toast.error(`Could not remove image: ${formatApiError(err)}`);
    }
  };

  return (
    <div className="relative space-y-3">
      <div>
        <Label>Additional Images</Label>
        <p className="text-xs text-muted">
          Shown in the product gallery after the display image. Upload as many as
          you need.
        </p>
      </div>

      {disabled ? (
        <p className="rounded-lg border border-dashed border-border bg-light-gray/30 px-3 py-4 text-center text-xs text-muted">
          Add a display image first to unlock additional images.
        </p>
      ) : (
        <>
          <label
            className={cn(
              "relative flex h-24 w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-white",
              loading
                ? "pointer-events-none"
                : "cursor-pointer hover:border-primary/40",
            )}
          >
            <Upload className="mb-1 h-5 w-5 text-muted" />
            <span className="text-xs text-muted">Add additional images</span>
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
            <UploadingOverlay show={loading} />
          </label>

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  {img.urls.medium || img.urls.display ? (
                    <Image
                      src={img.urls.medium || img.urls.display}
                      alt="Additional"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                  <span className="absolute bottom-1 left-1 rounded-full bg-green-600 p-0.5 text-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      onClick={() => void remove(img)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <label
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border text-muted",
                  loading
                    ? "pointer-events-none"
                    : "cursor-pointer hover:border-primary/30",
                )}
              >
                <Plus className="h-5 w-5" />
                <span className="text-[10px]">Add</span>
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
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-light-gray/30 px-3 py-4 text-center text-xs text-muted">
              No additional images yet — optional.
            </p>
          )}
        </>
      )}
    </div>
  );
}
