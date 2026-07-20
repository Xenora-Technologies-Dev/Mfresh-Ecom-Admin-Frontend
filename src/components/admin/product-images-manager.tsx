"use client";

import { useCallback, useState } from "react";
import type { UploadedImage } from "@/components/admin/multi-image-uploader";
import { ProductSlotUploader } from "@/components/admin/product-slot-uploader";
import { ProductSubImagesUploader } from "@/components/admin/product-sub-images-uploader";

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
  mainImage: UploadedImage | null;
  subImages: UploadedImage[];
  newImageIds: string[];
  onDisplayChange: (img: UploadedImage | null) => void;
  onMainChange: (img: UploadedImage | null) => void;
  onSubChange: (imgs: UploadedImage[]) => void;
  onNewIdsChange: (ids: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function ProductImagesManager({
  displayImage,
  mainImage,
  subImages,
  newImageIds,
  onDisplayChange,
  onMainChange,
  onSubChange,
  onNewIdsChange,
  onUploadingChange,
}: ProductImagesManagerProps) {
  const [slotUploading, setSlotUploading] = useState({
    display: false,
    main: false,
    sub: false,
  });

  const reportUploading = useCallback(
    (next: { display: boolean; main: boolean; sub: boolean }) => {
      onUploadingChange?.(next.display || next.main || next.sub);
    },
    [onUploadingChange],
  );

  const setUploading = useCallback(
    (key: "display" | "main" | "sub", value: boolean) => {
      setSlotUploading((prev) => {
        if (prev[key] === value) return prev;
        const next = { ...prev, [key]: value };
        reportUploading(next);
        return next;
      });
    },
    [reportUploading],
  );

  const trackNewId = (slot: "display" | "main", id: string | null) => {
    const others = newImageIds.filter((existing) => {
      if (slot === "display" && displayImage?.id === existing) return false;
      if (slot === "main" && mainImage?.id === existing) return false;
      return true;
    });
    onNewIdsChange(id ? [...others, id] : others);
  };

  return (
    <div className="relative space-y-8">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-dark-gray">
        <strong>How images appear on the store:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
          <li>
            <strong>Display image</strong> — shown on product cards in listings
            and homepage sliders.
          </li>
          <li>
            <strong>Main image</strong> — large hero image on the product
            detail page.
          </li>
          <li>
            <strong>Sub images</strong> — smaller gallery thumbnails; clicking
            one swaps the main view.
          </li>
        </ul>
      </div>

      <ProductSlotUploader
        label="Display Image"
        hint="Card image for product listings (recommended 4:3 ratio)."
        imageType="DISPLAY"
        value={displayImage}
        onChange={onDisplayChange}
        onNewId={(id) => trackNewId("display", id)}
        onUploadingChange={(v) => setUploading("display", v)}
        isNewUpload={displayImage ? newImageIds.includes(displayImage.id) : false}
        aspectClass="aspect-[4/3]"
      />

      <ProductSlotUploader
        label="Main Image"
        hint="Large image on the product detail page."
        imageType="MAIN"
        value={mainImage}
        onChange={onMainChange}
        onNewId={(id) => trackNewId("main", id)}
        onUploadingChange={(v) => setUploading("main", v)}
        isNewUpload={mainImage ? newImageIds.includes(mainImage.id) : false}
        aspectClass="aspect-square"
      />

      <ProductSubImagesUploader
        images={subImages}
        onChange={onSubChange}
        newImageIds={newImageIds.filter((id) =>
          subImages.some((s) => s.id === id),
        )}
        onNewIds={(ids) => {
          const slotNewIds = newImageIds.filter(
            (id) => id === displayImage?.id || id === mainImage?.id,
          );
          onNewIdsChange([...slotNewIds, ...ids]);
        }}
        onUploadingChange={(v) => setUploading("sub", v)}
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
  return {
    display: list.find((i) => i.type === "DISPLAY") ?? null,
    main: list.find((i) => i.type === "MAIN") ?? null,
    subs: list.filter((i) => i.type === "SUB"),
  };
}
