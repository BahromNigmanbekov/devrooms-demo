import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Stage 2+: frontend talks to the Socket.io server through this
      // proxy in dev so both apps can run on their own ports.
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
      },
    },
  },
});
