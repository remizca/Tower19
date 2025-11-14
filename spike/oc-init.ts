// Dedicated OpenCascade initialization module for Vite handling
// Ensures TypeScript awareness and explicit wasm asset inclusion.

import { initOpenCascade } from 'opencascade.js';

export async function loadOC() {
  const start = performance.now();
  const oc = await initOpenCascade();
  const ready = performance.now();
  return { oc, initMs: ready - start };
}

// Attach helper to window for manual console testing
// @ts-ignore
window.__ocLoad = loadOC;
