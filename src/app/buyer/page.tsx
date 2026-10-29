import { redirect } from "next/navigation";
import { STOREFRONT_URL } from "@/lib/site-urls";

const STOREFRONT = STOREFRONT_URL;

/** Buyer dashboard moved to the storefront. */
export default function BuyerPortalRedirect() {
  redirect(`${STOREFRONT}/buyer`);
}
