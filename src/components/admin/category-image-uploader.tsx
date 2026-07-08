"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Label } from "@/components/ui/input";
import { uploadCategoryImage, storageUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface CategoryImageUploaderProps {
  value?: string;
  imageUrl?: string;
  categoryId?: string;
  onChange: (path: string, url: string) => void;
  className?: string;
}

export function CategoryImageUploader({
  value,
  imageUrl,
  categoryId,
  onChange,
  className,
}: CategoryImageUploaderProps) {
  const [preview, setPreview] = useState(
    imageUrl ? storageUrl(imageUrl) : value ? storageUrl(value) : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError("");
      try {
        const result = await uploadCategoryImage(file, categoryId);
        const url = storageUrl(result.url);
        setPreview(url);
        onChange(result.path, url);
      } catch {
        setError("Upload failed. Check backend and R2/storage configuration.");
      } finally {
        setLoading(false);
      }
    },
    [categoryId, onChange],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Category Image</Label>
      <div className="flex items-start gap-3">
        <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white hover:border-primary/40">
          <Upload className="h-5 w-5 text-muted" />
          <span className="mt-1 text-[10px] text-muted">
            {loading ? "..." : "Upload"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
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
            <button
              type="button"
              onClick={() => {
                setPreview("");
                onChange("", "");
              }}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
