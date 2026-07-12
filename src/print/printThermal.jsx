// src/print/printThermal.js
import React from "react";
import { createRoot } from "react-dom/client";
// Vite: import CSS file content as a string to inject into the iframe:
import thermalCss from "./ThermalReceipt.css?inline";

export async function printThermal(element, { title = "Receipt" } = {}) {
  // Hidden iframe avoids popup blockers and keeps parent tab focused
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>${thermalCss}</style>
    </head>
    <body>
      <div id="root"></div>
    </body>
  </html>`);
  doc.close();

  // Render the JSX into the iframe using React 18’s createRoot
  await new Promise((r) => setTimeout(r, 0)); // let iframe attach
  const mount = doc.getElementById("root");
  const root = createRoot(mount);
  root.render(element);

  // Give the browser a tick to layout, then print
  await new Promise((r) => setTimeout(r, 50));
  iframe.contentWindow.focus();
  iframe.contentWindow.print();

  // Cleanup
  setTimeout(() => {
    root.unmount?.();
    document.body.removeChild(iframe);
  }, 1000);
}
