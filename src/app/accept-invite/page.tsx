"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

/**
 * Clerk invitation emails redirect here with `__clerk_ticket`.
 * SignUp handles the ticket flow for invited operations admins.
 */
export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Accept admin invitation</h2>
            <p className="mt-2 text-sm text-muted">
              Finish creating your MFresh operations account. You&apos;ll have admin
              access after sign-up.
            </p>
          </div>

          <SignUp
            routing="hash"
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
            signInUrl="/login"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none border border-border",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              },
            }}
          />

          <p className="mt-6 text-center text-xs text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
