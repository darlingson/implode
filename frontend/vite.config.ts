import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { Features } from "lightningcss";
import { defineConfig } from "vite";
import {
  getComponentChunkLinks,
  getFontLinks,
  getIconLinks,
  getMetaTagsAndIconLinks,
} from "@porsche-design-system/components-react/partials";

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Fixed port so the workflow below stays stable.
    port: 5173,
    strictPort: true,
    // Proxy backend routes to the Go server so `pnpm dev` gets live
    // API responses with Vite HMR — no Go rebuild/restart needed for
    // frontend changes. Go reads PORT from the env (default 8080).
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PORT ?? "8080"}`,
        changeOrigin: true,
      },
      "/healthz": {
        target: `http://localhost:${process.env.PORT ?? "8080"}`,
        changeOrigin: true,
      },
    },
  },
  css: {
    transformer: "lightningcss",
    // disables broken light-dark() polyfill, see PDS v4 docs
    // https://github.com/porsche-design-system/porsche-design-system/issues/4257
    lightningcss: {
      exclude: Features.LightDark,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "pds-partials",
      transformIndexHtml(html: string) {
        const headPartials = [
          getFontLinks(),
          getIconLinks(),
          getComponentChunkLinks(),
          getMetaTagsAndIconLinks({ appTitle: "Implode" }),
        ].join("");
        return html.replace(/<\/head>/, `${headPartials}$&`);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
