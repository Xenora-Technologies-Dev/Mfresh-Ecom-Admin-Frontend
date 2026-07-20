import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider, RedirectToTasks } from "@clerk/nextjs";
import { PortalShell } from "@/components/layout/portal-shell";
import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MFresh Portal",
    template: "%s | MFresh Portal",
  },
  description:
    "Secure B2B portal for buyers, sellers, and marketplace operations.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in to M Fresh",
      subtitle: "Welcome back! Continue to the MFresh portal.",
    },
  },
  signUp: {
    start: {
      title: "Create your M Fresh account",
      subtitle: "Join the MFresh portal to get started.",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased">
        <ClerkProvider
          localization={clerkLocalization}
          taskUrls={{
            "choose-organization": "/tasks/choose-organization",
          }}
        >
          <RedirectToTasks />
          <QueryProvider>
            <ToastProvider />
            <PortalAuthGuard>
              <PortalShell>
                <Suspense
                  fallback={
                    <div className="flex min-h-screen items-center justify-center bg-background">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  }
                >
                  {children}
                </Suspense>
              </PortalShell>
            </PortalAuthGuard>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
