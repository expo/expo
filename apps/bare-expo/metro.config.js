/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

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

// With `EXPO_BARE_EXPO_IGNORE_LIST_PACKAGES=1`, ignore-list the monorepo's packages the way an app
// ignore-lists them in `node_modules`, so React Native DevTools shows the stacks and initiators an
// app shows. Off by default, since it hides package frames while working on a package.
if (process.env.EXPO_BARE_EXPO_IGNORE_LIST_PACKAGES) {
  const packagesDir = path.resolve(__dirname, '../../packages') + path.sep;
  const isThirdPartyModule = config.serializer.isThirdPartyModule;
  config.serializer.isThirdPartyModule = (module) =>
    module.path.startsWith(packagesDir) || isThirdPartyModule(module);
}

module.exports = config;
