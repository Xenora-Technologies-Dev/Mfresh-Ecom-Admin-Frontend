import { redirect } from "next/navigation";

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

/** Seller dashboard moved to the storefront. */
export default function SellerPortalRedirect() {
  redirect(`${STOREFRONT}/seller`);
}
