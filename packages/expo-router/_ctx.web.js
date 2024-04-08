export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
<<<<<<< HEAD
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*(?:\.android|\.ios|\.native)?\.[tj]sx?$/,
=======
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+(html|native))))\.[tj]sx?$).*\.[tj]sx?$/,
>>>>>>> 26e79911e22 ([router]: add +native file support)
  process.env.EXPO_ROUTER_IMPORT_MODE
);
