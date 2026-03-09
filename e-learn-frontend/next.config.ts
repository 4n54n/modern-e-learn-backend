import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Hide the built-in Next.js dev overlay pill — replaced by our custom DevtoolsIndicator
    devIndicators: false,
};

export default nextConfig;
