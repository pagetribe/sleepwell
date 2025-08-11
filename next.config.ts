// Ensure isProd is defined before withPWA if it's not already
const isProd = process.env.NODE_ENV === 'production';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable PWA in development mode to avoid caching issues.
  disable: process.env.NODE_ENV === 'development',
  // ADD THIS LINE:
  basePath: isProd ? '/sleepwell' : '', // This tells next-pwa about your deployment subpath
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use the basePath and assetPrefix only for the production build on GitHub
  basePath: isProd ? '/sleepwell' : '',
  assetPrefix: isProd ? '/sleepwell/' : '',

  // Set output to 'export' only for the production build
  output: isProd ? 'export' : undefined,

  images: {
    // Keep this for static exports
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // You should aim to fix these errors rather than ignore them long-term
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);