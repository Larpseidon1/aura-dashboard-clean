/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization for Vercel
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 300, // 5 minutes
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Vercel optimizations
  compress: true,
  optimizeFonts: true,
  productionBrowserSourceMaps: false,
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
  },
  
  // Build optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Environment variables (secure)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY || '2b12a895-f3d3-430b-b7ca-90be4d83c820',
  },
  
  // Optimized caching strategy
  async headers() {
    return [
      {
        // Static assets
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes - shorter cache for dynamic data
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300', // 1min browser, 5min CDN
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
        ],
      },
      {
        // Pages - moderate caching
        source: '/((?!api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=900', // 5min browser, 15min CDN
          },
        ],
      },
    ];
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig 