import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma external (native engine); let Next bundle yahoo-finance2,
  // which ships ESM-only and must not be required as CommonJS at runtime.
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
