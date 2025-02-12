/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    }
  },
  serverExternalPackages: ['mongoose'],
  images: {
    domains: ['m.media-amazon.com']
  }
}

module.exports = nextConfig