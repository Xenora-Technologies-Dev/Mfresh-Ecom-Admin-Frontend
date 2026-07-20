"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationList, useSession } from "@clerk/nextjs";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Button } from "@/components/ui/button";
import { syncPortalAccess } from "@/lib/auth/sync-portal-access";
import { getDashboardPath } from "@/lib/auth/roles";
import { ensureUserOrganization } from "./_actions";

/**
 * Completes Clerk's choose-organization session task using Backend API org
 * creation (client create is often disabled in Clerk Dashboard).
 */
export default function ChooseOrganizationTaskPage() {
  const router = useRouter();
  const { session, isLoaded: sessionLoaded } = useSession();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const attempted = useRef(false);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(true);

  const finish = async (organizationId: string) => {
    if (setActive) {
      await setActive({ organization: organizationId });
    }
    const res = await syncPortalAccess();
    router.replace(res.ok ? getDashboardPath(res.portalRole) : "/");
  };

  const resolve = async () => {
    setError("");
    setResolving(true);
    try {
      const existing = userMemberships.data?.[0]?.organization?.id;
      if (existing) {
        await finish(existing);
        return;
      }

      const ensured = await ensureUserOrganization();
      if (!ensured.ok) {
        setError(ensured.error);
        setResolving(false);
        return;
      }

      await finish(ensured.organizationId);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not finish organization setup. Try again, or enable Personal Accounts in Clerk.",
      );
      setResolving(false);
    }
  };

  useEffect(() => {
    if (!sessionLoaded || !isLoaded || attempted.current) return;

    if (session && !session.currentTask) {
      attempted.current = true;
      void (async () => {
        const res = await syncPortalAccess();
        router.replace(res.ok ? getDashboardPath(res.portalRole) : "/");
      })();
      return;
    }

    if (session?.currentTask?.key && session.currentTask.key !== "choose-organization") {
      return;
    }

    attempted.current = true;
    void resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when session/org list ready
  }, [isLoaded, sessionLoaded, session?.currentTask?.key]);

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Finish signing in</h2>
          <p className="mb-6 text-sm text-muted">
            Your Clerk app requires an organization. We create a workspace for your
            portal account automatically.
          </p>

          {resolving && (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted">Creating your workspace…</p>
            </div>
          )}

          {!resolving && (
            <div className="space-y-4 rounded-xl border border-border bg-white p-6">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-sm text-muted">
                If this keeps failing, in Clerk Dashboard open{" "}
                <strong>Organizations → Settings</strong> and either:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Set membership to <strong>optional</strong> (personal accounts), or</li>
                <li>Allow users to create organizations</li>
              </ul>
              <Button type="button" className="w-full" onClick={() => void resolve()}>
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
