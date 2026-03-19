import type { NextConfig } from 'next';
import path from 'path';

const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';
const isProd = appEnv === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.join(__dirname, '../..'),
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Source maps: full in dev/staging for debugging, hidden in prod
  productionBrowserSourceMaps: !isProd,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Environment-aware logging
  logging: {
    fetches: {
      fullUrl: !isProd,
    },
  },

  headers: async () => [
    {
      source: '/:all*(svg|jpg|png|webp|avif|woff2|woff|ttf)',
      headers: [
        {
          key: 'Cache-Control',
          value: isProd
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=3600',
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
    // Security headers (all environments)
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

export default nextConfig;
