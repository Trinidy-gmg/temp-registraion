import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hollowedoath.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
