/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@xenova/transformers'],

  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers'],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;