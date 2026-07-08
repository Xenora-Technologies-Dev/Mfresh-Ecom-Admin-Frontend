"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Upload, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { uploadImage, storageUrl } from "@/lib/api/client";
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

interface ImageUploaderProps {
  type?: "MAIN" | "SUB" | "DISPLAY";
  label?: string;
  onUploaded: (image: UploadedImage) => void;
  className?: string;
}

export function ImageUploader({
  type = "DISPLAY",
  label = "Upload Image",
  onUploaded,
  className,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<UploadedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError("");
      try {
        const result = await uploadImage(file, type, true);
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
        setPreview(img);
      } catch {
        setError("Upload failed. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    },
    [type],
  );

  const confirm = () => {
    if (preview) onUploaded(preview);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white transition-colors hover:border-primary/40 sm:w-48">
          <Upload className="mb-2 h-6 w-6 text-muted" />
          <span className="text-xs text-muted">
            {loading ? "Processing..." : "Click to upload"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>

        {preview && (
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["display", "thumbnail", "medium", "large"] as const).map((size) => (
                <div key={size} className="space-y-1">
                  <p className="text-xs font-medium capitalize text-muted">{size}</p>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-background">
                    <Image
                      src={preview.urls[size]}
                      alt={size}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirm}>
                <Eye className="h-4 w-4" />
                Confirm & Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreview(null)}
              >
                <X className="h-4 w-4" />
                Discard
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
