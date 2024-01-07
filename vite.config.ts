import path from "node:path"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(".") },
  },
})