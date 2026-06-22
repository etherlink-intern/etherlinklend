import { defineConfig } from "vite";

export default defineConfig({
  server: {
    allowedHosts: ["etherlinklend.etherlinkinsights.com"],
  },
  preview: {
    allowedHosts: ["etherlinklend.etherlinkinsights.com"],
  },
});
