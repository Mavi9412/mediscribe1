/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "uploads.onecompiler.io",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // See https://webpack.js.org/configuration/resolve/#resolvefallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
        events: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

    