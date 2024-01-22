import { EXPO_ROUTER_CTX_IGNORE } from './_ctx-shared';

export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  EXPO_ROUTER_CTX_IGNORE,
  process.env.EXPO_ROUTER_IMPORT_MODE
);
