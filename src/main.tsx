if (import.meta.env.DEV) {
  import("react-grab");
  import("react-scan");
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import { clerkPublishableKey, hasClerkConfig } from "./lib/config";
import { ClerkSupabaseBridge } from "./auth/ClerkAuth";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {hasClerkConfig ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <ClerkSupabaseBridge />
          <App />
        </ClerkProvider>
      ) : <App />}
    </BrowserRouter>
  </React.StrictMode>,
);
