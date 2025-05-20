import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ezy4prk6sg.ufs.sh',
      },
    ],
  },
};

export default nextConfig;
