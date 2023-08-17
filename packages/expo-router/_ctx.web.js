export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  /.*/,
  // TODO: This isn't toggling as expected.
  'lazy'
  // process.env.EXPO_ROUTER_IMPORT_MODE_WEB
);
