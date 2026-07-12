import { redirect } from "next/navigation";

export default function WishlistsRedirectPage() {
  redirect("/messages?type=wishlist");
}
