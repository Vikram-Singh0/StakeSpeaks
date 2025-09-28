import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow build to continue even if there are type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Ignore webpack warnings about missing optional dependencies
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found.*@react-native-async-storage\/async-storage/
    ];
    return config;
  }
};

export default nextConfig;
