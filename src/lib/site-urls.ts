/**
 * Public URLs for links out of the admin portal. Set the env vars on Netlify;
 * in production the fallback is the live domain, never localhost.
 */
const isProd = process.env.NODE_ENV === "production";

function clean(url: string | undefined): string | undefined {
  const v = url?.trim();
  return v ? v.replace(/\/+$/, "") : undefined;
}

export const STOREFRONT_URL =
  clean(process.env.NEXT_PUBLIC_STOREFRONT_URL) ??
  (isProd ? "https://mfreshtradehub.com" : "http://localhost:3006");

export const PORTAL_URL =
  clean(process.env.NEXT_PUBLIC_PORTAL_URL) ??
  (isProd ? "https://admin.mfreshtradehub.com" : "http://localhost:3007");
