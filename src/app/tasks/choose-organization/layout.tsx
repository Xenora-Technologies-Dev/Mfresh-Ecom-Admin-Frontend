import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose organization",
};

export default function ChooseOrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
