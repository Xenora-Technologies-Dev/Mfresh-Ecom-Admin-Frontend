import { redirect } from "next/navigation";

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

/** Buyer dashboard moved to the storefront. */
export default function BuyerPortalRedirect() {
  redirect(`${STOREFRONT}/buyer`);
}
