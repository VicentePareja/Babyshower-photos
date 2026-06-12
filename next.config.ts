import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // la quiniela se rebautizó como El Oráculo del Bosque
    return [
      { source: "/quiniela", destination: "/oraculo", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
