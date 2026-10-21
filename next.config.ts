import type { NextConfig } from "next";
import path from "path";

const r2Host = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL
  ? new URL(process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL).hostname
  : null;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4005" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(r2Host
        ? [{ protocol: "https" as const, hostname: r2Host }]
        : [{ protocol: "https" as const, hostname: "*.r2.dev" }]),
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
