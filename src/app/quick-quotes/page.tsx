import { redirect } from "next/navigation";

export default function QuickQuotesRedirectPage() {
  redirect("/messages?type=quote");
}
