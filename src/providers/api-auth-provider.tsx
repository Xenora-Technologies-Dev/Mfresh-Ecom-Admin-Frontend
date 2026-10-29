"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setApiTokenGetter } from "@/lib/api/client";

export function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setApiTokenGetter(null);
      return;
    }
    setApiTokenGetter(() => getToken());
    return () => setApiTokenGetter(null);
  }, [getToken, isSignedIn]);

  return <>{children}</>;
}
