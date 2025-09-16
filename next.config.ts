import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1748789572583.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev",
        "https://9000-firebase-studio-1748789572583.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev",
    ]
  }
};

export default nextConfig;
