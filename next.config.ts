import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Parent frontend/ also has a package-lock.json. Pin to the parent so Turbopack
  // stops warning; pointing at Admin alone breaks the React Client Manifest.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4005" },
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
