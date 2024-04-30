// Ignore root `./+html.js` and API route files `./generate+api.tsx`.
module.exports = {
  EXPO_ROUTER_CTX_IGNORE:
    /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+(html|native-intent))))\.[tj]sx?$).*\.[tj]sx?$/,
};
