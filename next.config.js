const million = require("million/compiler");
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  experimental: {
    swcPlugins: [["@swc-jotai/react-refresh", {}]],
  },
  images: {
    unoptimized: true,
  }
};

module.exports = million.next(nextConfig, { auto: true });
