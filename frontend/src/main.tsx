import "@fontsource-variable/figtree";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import { BaseProvider } from "baseui";
import { implodeTheme } from "./theme";

import "./index.css";
import App from "./App.tsx";

const engine = new Styletron();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StyletronProvider value={engine}>
      <BaseProvider theme={implodeTheme}>
        <App />
      </BaseProvider>
    </StyletronProvider>
  </StrictMode>,
);
