import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: process.env.NEXT_PUBLIC_CAFE_NAME || "Café",
    short_name: process.env.NEXT_PUBLIC_CAFE_NAME || "Café",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#292524",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
