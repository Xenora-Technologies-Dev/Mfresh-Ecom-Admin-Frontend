"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SignIn, useSession, useUser } from "@clerk/nextjs";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { parsePortalRole } from "@/lib/auth/roles";

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

export default function LoginPage() {
  const router = useRouter();
  const { session, isLoaded } = useSession();
  const { user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (session?.currentTask?.key === "choose-organization") {
      router.replace("/tasks/choose-organization");
    }
  }, [isLoaded, router, session?.currentTask?.key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("choose-organization")) {
      router.replace("/tasks/choose-organization");
    }
  }, [router]);

  // Buyers/sellers who land here go to the storefront dashboards.
  useEffect(() => {
    if (!userLoaded || !user) return;
    const meta = user.publicMetadata as Record<string, unknown>;
    const role = parsePortalRole(meta.portalRole);
    if (role === "buyer" || role === "seller") {
      window.location.href = `${STOREFRONT}/${role}`;
    }
  }, [user, userLoaded]);

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="inline-block rounded-xl bg-white p-2 shadow-sm ring-1 ring-border">
              <Image src="/logo.png" alt="MFresh" width={120} height={40} className="h-8 w-auto" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Operations sign in
            </h2>
            <p className="mt-2 text-sm text-muted">
              This portal is for invited MFresh operations administrators only.
              Buyers and sellers sign in on the storefront.
            </p>
          </div>

          <SignIn
            routing="hash"
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none border border-border",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footerAction: "hidden",
              },
            }}
          />

          <p className="mt-6 text-center text-xs text-muted">
            Buyer or seller?{" "}
            <a
              href={`${STOREFRONT}/login`}
              className="font-medium text-primary hover:underline"
            >
              Sign in on the storefront
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
