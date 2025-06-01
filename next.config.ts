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
    // Esta es la configuración necesaria para permitir solicitudes desde el entorno de vista previa de Firebase Studio.
    // El valor específico del host puede cambiar según tu entorno de Cloud Workstations.
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748789572583.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev',
      // Puedes añadir más orígenes aquí si es necesario, por ejemplo, si tienes varios entornos de vista previa.
    ],
  },
};

export default nextConfig;
