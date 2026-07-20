"use client";

import { useCallback, useEffect } from "react";
import { confirmCancelUpload } from "@/components/admin/uploading-overlay";

/**
 * Blocks browser tab close/refresh while an upload is in progress,
 * and provides a helper to confirm before dismissing a modal or navigating away.
 */
export function useUploadGuard(isUploading: boolean) {
  useEffect(() => {
    if (!isUploading) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isUploading]);

  const requestClose = useCallback((): boolean => {
    if (!isUploading) return true;
    return confirmCancelUpload();
  }, [isUploading]);

  return { requestClose };
}
