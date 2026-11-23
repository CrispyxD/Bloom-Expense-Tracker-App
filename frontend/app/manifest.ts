import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bloom Expense Tracker",
    short_name: "Bloom",
    description:
      "A thoughtful place to track your income, expenses, budgets, and financial goals.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8fc",
    theme_color: "#7669df",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
