import { redirect } from "next/navigation";
import { STOREFRONT_URL } from "@/lib/site-urls";

const STOREFRONT = STOREFRONT_URL;

/** Seller dashboard moved to the storefront. */
export default function SellerPortalRedirect() {
  redirect(`${STOREFRONT}/seller`);
}
