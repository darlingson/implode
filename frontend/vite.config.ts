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
