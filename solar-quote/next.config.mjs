const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: deployable to Vercel, GitHub Pages or any static host.
  // Set NEXT_PUBLIC_BASE_PATH (e.g. /solar-quote) when serving from a sub-path.
  output: 'export',
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
