import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4005" },
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
