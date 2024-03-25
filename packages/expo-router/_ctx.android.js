export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*(?:\.ios|\.web)\.[tj]sx?$/,
  process.env.EXPO_ROUTER_IMPORT_MODE
);
