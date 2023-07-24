export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT!,
  true,
  /.*/,
  // @ts-expect-error
  process.env.EXPO_ROUTER_IMPORT_MODE_IOS
);
