import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['komnottra.runbuddies.win'],
  devIndicators: false,
};

export default nextConfig;
