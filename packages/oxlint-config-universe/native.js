import { defineConfig } from 'oxlint';

import core from './shared/core.js';
import react from './shared/react.js';
import typescript from './shared/typescript.js';

export default defineConfig({
  extends: [core, typescript, react],
  globals: {
    __DEV__: 'readonly',
    Atomics: 'readonly',
    ErrorUtils: 'readonly',
    FormData: 'readonly',
    SharedArrayBuffer: 'readonly',
    XMLHttpRequest: 'readonly',
    alert: 'readonly',
    cancelAnimationFrame: 'readonly',
    cancelIdleCallback: 'readonly',
    clearImmediate: 'readonly',
    clearInterval: 'readonly',
    clearTimeout: 'readonly',
    fetch: 'readonly',
    navigator: 'readonly',
    process: 'readonly',
    requestAnimationFrame: 'readonly',
    requestIdleCallback: 'readonly',
    setImmediate: 'readonly',
    setInterval: 'readonly',
    setTimeout: 'readonly',
    window: 'readonly',
  },
});
