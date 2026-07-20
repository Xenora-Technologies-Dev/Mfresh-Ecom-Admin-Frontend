import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Accept your MFresh operations admin invitation.",
};

export default function AcceptInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
