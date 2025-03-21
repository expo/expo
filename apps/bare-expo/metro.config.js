/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const { boolish, bool } = require('getenv');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const monorepoRoot = path.join(__dirname, '../..');

config.resolver.assetExts.push(
  'kml', // See: ../native-component-list/assets/expo-maps/sample_kml.kml
  'wasm' // For expo-sqlite on web
);

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
  path.join(monorepoRoot, 'apps/common'), // Allow Metro to resolve common ThemeProvider
  path.join(monorepoRoot, 'apps/native-component-list'), // Workaround for Yarn v1 workspace issue where workspace dependencies aren't properly linked, should be at `<root>/node_modules/apps/native-component-list`
  path.join(monorepoRoot, 'apps/test-suite'), // Workaround for Yarn v1 workspace issue where workspace dependencies aren't properly linked, should be at `<root>/node_modules/apps/test-suite`
];

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

// We'd like to get rid of `native-component-list` being a part of the final bundle.
// Otherwise, some tests may fail due to timeouts (bundling takes significantly more time).
const removeNCLFromBundle = boolish('CI', false) || boolish('NO_NCL', false);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // When testing on MacOS we need to swap out `react-native` for `react-native-macos`
  if (
    platform === 'macos' &&
    (moduleName === 'react-native' || moduleName.startsWith('react-native/'))
  ) {
    return context.resolveRequest(
      context,
      moduleName.replace('react-native', 'react-native-macos'),
      platform
    );
  }

  // We'd like to get rid of `native-component-list` being a part of the final bundle.
  // Otherwise, some tests may fail due to timeouts (bundling takes significantly more time).
  if (
    removeNCLFromBundle &&
    (moduleName === 'native-component-list' || moduleName.startsWith('native-component-list/'))
  ) {
    return { type: 'empty' };
  }

  return context.resolveRequest(context, moduleName, platform);
};

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

module.exports = config;
