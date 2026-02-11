/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Data cache version: invalidates cached stats when app is redeployed
    NEXT_PUBLIC_BUILD_ID:
      process.env.NEXT_PUBLIC_BUILD_ID ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_REF ||
      "dev",
  },
};

module.exports = nextConfig;
