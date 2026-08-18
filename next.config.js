/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Never emit browser source maps in production — keeps server logic out of the client bundle.
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  // Images are served through our own /api/image proxy (same-origin), so we deliberately
  // do NOT need next/image remote host config. This keeps the app robust regardless of
  // where OrderMS hosts its images.
  images: {
    // Next's defaults go up to 3840px (desktop-oriented). Nothing in this catalogue's
    // UI ever renders an image above ~430px (grid tiles, modal gallery, thumbnails),
    // so the huge default list only means more distinct width variants — each one a
    // full-resolution origin fetch through /api/image the first time it's requested.
    // Trimming this list directly cuts cold-cache load time on category tabs.
    deviceSizes: [384, 640, 828, 1080],
    imageSizes: [56, 96, 128, 192, 256, 384],
    // Match (or exceed) the origin image cache lifetime so the optimizer's own cache
    // isn't the limiting factor.
    minimumCacheTTL: Number(process.env.ORDERMS_IMAGE_CACHE_SECONDS) || 86400,
  },
  env: {
    // Vercel sets VERCEL_ENV to "production" / "preview" / "development" at build
    // time; it's undefined for any purely local run (dev or `next start`). Exposed
    // client-side so analytics can tag events by environment instead of mixing
    // local testing into real production data.
    NEXT_PUBLIC_APP_ENV: process.env.VERCEL_ENV || "development",
  },
};

module.exports = nextConfig;
