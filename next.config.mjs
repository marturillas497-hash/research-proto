/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 15 handles most of this automatically, but we keep the transpile
  transpilePackages: ['@xenova/transformers'],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // This is the stable way to tell Webpack to ignore Node-only modules
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