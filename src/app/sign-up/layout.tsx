import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a buyer or seller organization on MFresh Portal.",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
