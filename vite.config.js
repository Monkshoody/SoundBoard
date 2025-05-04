import { defineConfig } from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy'; 

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: '_headers',
          dest: '.' // kopiert in dist/
        }
      ]
    })
  ],
  server: {
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});