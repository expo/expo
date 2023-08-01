export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  /.*/,
  process.env.EXPO_ROUTER_IMPORT_MODE_WEB
);
