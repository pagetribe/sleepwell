// next.config.js

import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  output: 'export',

  // IMPORTANT: Set basePath and assetPrefix for GitHub Pages
  basePath: '/sleepwell',
  assetPrefix: '/sleepwell/',

  // CRITICAL: This is needed for next/image to work with static exports
  images: {
    unoptimized: true, // ADD THIS
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // WARNING: These lines hide errors. You should remove them and fix the errors.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);