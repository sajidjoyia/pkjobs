import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into their own chunks so the main bundle
        // stays small and pages load faster on first visit.
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "router";
          if (id.includes("@tanstack/react-query")) return "react-query";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("framer-motion") || id.includes("motion")) return "motion";
          if (id.includes("react-dom") || id.includes("react/")) return "react";
          return "vendor";
        },
      },
    },
  },
}));
