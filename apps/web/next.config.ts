import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@beui-ai-studio/ai",
    "@beui-ai-studio/auth",
    "@beui-ai-studio/db",
  ],
  turbopack: {
    root: fileURLToPath(new URL("../../", import.meta.url)),
  },
};

export default nextConfig;
