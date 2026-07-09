/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // מאפשר תצוגת תמונות שהמנהל מעלה (data URLs / קבצים מקומיים)
    remotePatterns: [],
  },
};

module.exports = nextConfig;
