/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'esv.ch',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'esv.ch',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
