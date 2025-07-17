import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dpop.nyc3.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
