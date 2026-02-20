/**
 * @file Entry point for the React application.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { syncInitialTheme } from "./hooks/useTheme";
import "./index.css";

syncInitialTheme();

const setVH = () => {
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`,
  );
};

setVH();
window.addEventListener("resize", setVH);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
