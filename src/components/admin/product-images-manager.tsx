"use client";

import { useCallback, useEffect, useState } from "react";
import type { UploadedImage } from "@/components/admin/multi-image-uploader";
import { ProductSlotUploader } from "@/components/admin/product-slot-uploader";
import { ProductAdditionalImagesUploader } from "@/components/admin/product-additional-images-uploader";
import { deleteImage } from "@/lib/api/client";

function toUploadedImage(img: {
  id: string;
  type: string;
  display?: string;
  thumbnail?: string;
  medium?: string;
  large?: string;
}): UploadedImage {
  return {
    id: img.id,
    type: img.type,
    urls: {
      display: img.display ?? "",
      thumbnail: img.thumbnail ?? "",
      medium: img.medium ?? "",
      large: img.large ?? "",
    },
  };
}

interface ProductImagesManagerProps {
  displayImage: UploadedImage | null;
  additionalImages: UploadedImage[];
  newImageIds: string[];
  onDisplayChange: (img: UploadedImage | null) => void;
  onAdditionalChange: (imgs: UploadedImage[]) => void;
  onNewIdsChange: (ids: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function ProductImagesManager({
  displayImage,
  additionalImages,
  newImageIds,
  onDisplayChange,
  onAdditionalChange,
  onNewIdsChange,
  onUploadingChange,
}: ProductImagesManagerProps) {
  const [slotUploading, setSlotUploading] = useState({
    display: false,
    additional: false,
  });

  useEffect(() => {
    onUploadingChange?.(slotUploading.display || slotUploading.additional);
  }, [slotUploading, onUploadingChange]);

  const setUploading = useCallback(
    (key: "display" | "additional", value: boolean) => {
      setSlotUploading((prev) => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  const trackDisplayId = (id: string | null) => {
    const others = newImageIds.filter((existing) => existing !== displayImage?.id);
    onNewIdsChange(id ? [...others, id] : others);
  };

  const handleDisplayChange = (img: UploadedImage | null) => {
    if (!img && additionalImages.length > 0) {
      const toRemove = [...additionalImages];
      onAdditionalChange([]);
      onNewIdsChange(
        newImageIds.filter((id) => !toRemove.some((a) => a.id === id)),
      );
      void (async () => {
        await Promise.all(
          toRemove.map(async (extra) => {
            try {
              await deleteImage(extra.id);
            } catch {
              /* ignore */
            }
          }),
        );
      })();
    }
    onDisplayChange(img);
  };

  return (
    <div className="relative space-y-8">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-dark-gray">
        <strong>How images appear on the store:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
          <li>
            <strong>Display image</strong> — shown on product cards in listings
            and as the large image on the product detail page (1 image only).
          </li>
          <li>
            <strong>Additional images</strong> — gallery images on the product
            detail page. Requires a display image first; upload as many as needed.
          </li>
        </ul>
      </div>

      <ProductSlotUploader
        label="Display Image"
        hint="Required for listings and the main product view (recommended 4:3 ratio)."
        imageType="DISPLAY"
        value={displayImage}
        onChange={handleDisplayChange}
        onNewId={trackDisplayId}
        onUploadingChange={(v) => setUploading("display", v)}
        isNewUpload={displayImage ? newImageIds.includes(displayImage.id) : false}
        aspectClass="aspect-[4/3]"
      />

      <ProductAdditionalImagesUploader
        images={additionalImages}
        onChange={onAdditionalChange}
        disabled={!displayImage}
        newImageIds={newImageIds.filter((id) =>
          additionalImages.some((s) => s.id === id),
        )}
        onNewIds={(ids) => {
          const displayIds = displayImage?.id ? [displayImage.id] : [];
          const keptDisplay = newImageIds.filter((id) => displayIds.includes(id));
          onNewIdsChange([...keptDisplay, ...ids]);
        }}
        onUploadingChange={(v) => setUploading("additional", v)}
      />
    </div>
  );
}

export function splitProductImages(
  imageUrls: {
    id: string;
    type: string;
    display?: string;
    thumbnail?: string;
    medium?: string;
    large?: string;
  }[],
) {
  const list = imageUrls.map(toUploadedImage);
  const display =
    list.find((i) => i.type === "DISPLAY") ??
    list.find((i) => i.type === "MAIN") ??
    null;
  const additional = list.filter(
    (i) => i.type === "ADDITIONAL" || i.type === "SUB",
  );
  return { display, additional };
}
