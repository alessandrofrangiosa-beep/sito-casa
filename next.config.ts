import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Render AI restituiti da fal.ai / OpenAI vengono mostrati come <img> semplici (URL esterni o data URI)
  },
  // Le foto reali usate da "Arredala tu" vengono lette dal filesystem dalla API route /api/render
  outputFileTracingIncludes: {
    "/api/render": ["./public/images/attuali/**/*"],
  },
};

export default nextConfig;
