/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'kml', // See: ../native-component-list/assets/expo-maps/sample_kml.kml
  'wasm' // For expo-sqlite on web
);

// TODO(gabrieldonadel): Remove this when bumping react-native-macos to 0.83.0
const upstream = config.server?.rewriteRequestUrl;
config.server.rewriteRequestUrl = function rewriteRequestUrl(url) {
  let next = upstream ? upstream(url) : url;
  if (!next.includes('platform=macos')) return next;

  // Hermes V1 is not supported on macOS yet and setting engine=hermes causes
  // the transformer to fail with "SyntaxError: 36642:5:private properties are not supported"
  return next.replace('&transform.engine=hermes', '');
};

// writing a screenshot otherwise shows a metro refresh banner at the top of the screen which can interfere with another screenshot
config.resolver.blockList.push(/^e2e/);

// `expo-sqlite` uses `SharedArrayBuffer` on web, which requires explicit COOP and COEP headers
// See: https://github.com/expo/expo/pull/35208
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

module.exports = config;
