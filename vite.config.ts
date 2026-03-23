import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  base: process.env.BASE_URL || "",
  resolve: {
    alias: { "@": path.resolve(".") },
  },
})
