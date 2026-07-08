import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased">
        <QueryProvider>
          <ToastProvider />
          <PortalAuthGuard>
            <PortalShell>
              <Suspense fallback={null}>{children}</Suspense>
            </PortalShell>
          </PortalAuthGuard>
        </QueryProvider>
      </body>
    </html>
  );
}
