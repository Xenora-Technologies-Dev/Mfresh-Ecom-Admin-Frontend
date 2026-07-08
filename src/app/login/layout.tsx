import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to MFresh Portal — buyer, seller, and operations workspaces.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
