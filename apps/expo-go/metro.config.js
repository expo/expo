/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const monorepoRoot = path.join(__dirname, '../..');

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
  path.join(monorepoRoot, 'apps/common'), // Allow Metro to resolve common ThemeProvider
];

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

// Integrate `react-native-lab` as the React Native version used when bundling
module.exports = withReactNativeLabPackages(config);

/**
 * Configure Metro to resolve core React Native packages from the react-native-lab submodule.
 * Expo Go requires specific fixes which are shipped through this submodule.
 * This will override and not follow Node module resolution to ensure single package versions are bundled.
 *
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withReactNativeLabPackages(config) {
  // Keep this list up to date for every React Native upgrade.
  // These packages are all dependent on the current version in react-native-lab.
  const linkedPackages = [
    'react',
    'react-native',
    // '@react-native/assets-registry', - This is overwritten from Expo CLI and replaced by a virtual module
    // '@react-native/codegen', - This is not a library used within the app bundle
    // '@react-native/js-polyfills', - This is not a library used within the app bundle, but configured through `config.serializer.getPolyfills`
    '@react-native/normalize-colors',
    '@react-native/virtualized-lists',
  ];

  // The react-native-lab location to use when redirecting resolutions to react-native-lab
  const reactNativeLabsPath = path.join(monorepoRoot, 'react-native-lab/react-native/node_modules');

  // Allow Metro to resolve from react-native-lab dependencies and packages
  config.watchFolders.push(path.join(reactNativeLabsPath, '..'));

  // Ensure the polyfills are loaded from react-native-lab
  config.serializer.getPolyfills = () =>
    require(require.resolve('@react-native/js-polyfills', { paths: [reactNativeLabsPath] }))();

  // Ensure the initialize code is being loaded from react-native-lab
  const getMainModules = config.serializer.getModulesRunBeforeMainModule;
  config.serializer.getModulesRunBeforeMainModule = () => {
    // This module import should be loaded from `react-native-lab`
    const initializeCore = 'react-native/Libraries/Core/InitializeCore.js';
    const initializeCorePath = require.resolve(initializeCore, { paths: [reactNativeLabsPath] });
    // Ensure the old initialize core path is replaced with the react-native-lab version
    return getMainModules().map((filePath) => {
      if (filePath.endsWith(initializeCore)) {
        return initializeCorePath;
      }

      return filePath;
    });
  };

  // The import matcher that matches any of the list packages, e.g. `<packageName>` or `<packageName>/nested/file`
  const importMatcher = new RegExp(`^(?:(${linkedPackages.join('|')}))(?:(/|$))`);

  // Rewrite imports to the react-native-lab linked packages when on Android or iOS
  config.resolver.resolveRequest = (context, moduleImport, platform) => {
    if (platform === 'web' || !importMatcher.test(moduleImport)) {
      return context.resolveRequest(context, moduleImport, platform);
    }

    return context.resolveRequest(
      {
        ...context,
        originModulePath: reactNativeLabsPath,
        // Also list the react-native-lab node modules folder for Expo's fast resolver
        // But only do it for the packages that are "linked" from react-native-lab
        nodeModulesPaths: [reactNativeLabsPath, ...context.nodeModulesPaths],
      },
      moduleImport,
      platform
    );
  };

  return config;
}
