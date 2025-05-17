import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Generate static files for Capacitor
  output: 'export',

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow external placeholder images (remove or extend as you need)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
