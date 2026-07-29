import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/Aperture-UI/",
  root: "pages-src",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
