import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/security";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@heyputer/puter.js"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
