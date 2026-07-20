"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadingOverlayProps {
  show: boolean;
  label?: string;
  className?: string;
}

export function UploadingOverlay({
  show,
  label = "Uploading image…",
  className,
}: UploadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-white/85 backdrop-blur-[1px]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="px-2 text-center text-xs font-semibold text-dark-gray">
        {label}
      </span>
    </div>
  );
}

export const UPLOAD_IN_PROGRESS_CONFIRM =
  "Image upload is in progress. Do you want to cancel it and close this window?";

export function confirmCancelUpload(): boolean {
  return window.confirm(UPLOAD_IN_PROGRESS_CONFIRM);
}
