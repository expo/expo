/// <reference types="./index" />

/** Optionally import `app/+html.js` file. */
export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT!,
  false,
  /\+html\.[tj]sx?$/,
  "sync"
);
