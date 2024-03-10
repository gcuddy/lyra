const million = require("million/compiler");
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  experimental: {
    swcPlugins: [["@swc-jotai/react-refresh", {}]],
    forceSwcTransforms: true,
    scrollRestoration: true,
  },
  images: {
    unoptimized: true,
  }
};

module.exports = million.next(nextConfig, { auto: true });
