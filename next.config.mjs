/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuration for Netlify deployment
  trailingSlash: true,
  
  // Add experimental features for better compatibility
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
  },
}

export default nextConfig
