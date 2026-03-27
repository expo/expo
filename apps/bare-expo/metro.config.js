/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'kml', // See: ../native-component-list/assets/expo-maps/sample_kml.kml
  'wasm' // For expo-sqlite on web
);

// When testing on MacOS we need to swap out `react-native` for `react-native-macos`
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'macos' &&
    (moduleName === 'react-native' || moduleName.startsWith('react-native/'))
  ) {
    const newModuleName = moduleName.replace('react-native', 'react-native-macos');
    return context.resolveRequest(context, newModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};
// writing a screenshot otherwise shows a metro refresh banner at the top of the screen which can interfere with another screenshot
config.resolver.blockList.push(/.*bare-expo\/e2e.*/);

// When testing on MacOS we need to include the `react-native-macos/Libraries/Core/InitializeCore` as prepended global module
const originalGetModulesRunBeforeMainModule = config.serializer.getModulesRunBeforeMainModule;
config.serializer.getModulesRunBeforeMainModule = () => {
  try {
    return [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
      require.resolve('react-native-macos/Libraries/Core/InitializeCore'),
    ];
  } catch {}
  return originalGetModulesRunBeforeMainModule();
};

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
