import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Render AI restituiti da fal.ai / OpenAI vengono mostrati come <img> semplici (URL esterni o data URI)
  },
  // Le foto base dello studio AI vengono lette dal filesystem dalla API route
  outputFileTracingIncludes: {
    "/api/generate-render": ["./public/images/stanze-base-ai/**/*"],
  },
};

export default nextConfig;
