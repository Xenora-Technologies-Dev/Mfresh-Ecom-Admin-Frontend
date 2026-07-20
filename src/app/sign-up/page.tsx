import { redirect } from "next/navigation";

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3006";

type SearchParams = Record<string, string | string[] | undefined>;

/** Buyer/seller self-serve signup lives on the storefront. */
export default async function SignUpRedirectPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const roleRaw = params.role;
  const role = Array.isArray(roleRaw) ? roleRaw[0] : roleRaw;
  const q = role === "seller" || role === "buyer" ? `?role=${role}` : "";
  redirect(`${STOREFRONT}/sign-up${q}`);
}
