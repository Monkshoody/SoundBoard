import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    sourcemap: true,
  },
  server: {
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});