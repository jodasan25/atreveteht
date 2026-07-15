// Safe global fetch getter/setter proxy to prevent "Cannot set property fetch of #<Window> which has only a getter" errors 
// caused by some browser extensions, tools, or sandboxed iframe environments that try to patch window.fetch.
try {
  const nativeFetch = window.fetch;
  let customFetch = nativeFetch;
  Object.defineProperty(window, "fetch", {
    get() {
      return customFetch;
    },
    set(value) {
      customFetch = value;
    },
    configurable: true,
    enumerable: true,
  });
} catch (e) {
  console.warn("Could not patch window.fetch with custom getter/setter:", e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
