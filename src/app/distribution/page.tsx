import { redirect } from "next/navigation";

export default function DistributionRedirectPage() {
  redirect("/messages?type=distribution");
}
