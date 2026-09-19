/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        deviceSizes: [320, 420, 640, 768, 1024, 1280, 1440, 1920],
        imageSizes: [16, 32, 48, 64, 80, 96, 128, 256],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'api.telegram.org',
            },
        ],
    },
};

export default nextConfig;
