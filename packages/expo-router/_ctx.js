export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  // Ignore root `./+html.js` and API route files `./generate+api.tsx`.
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*\.[tj]sx?$/
);
