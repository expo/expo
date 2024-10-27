// Learn more https://docs.expo.dev/guides/customizing-metro/
/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.join(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  // Exclude react-native-lab from haste map.
  // Because react-native versions may be different between node_modules/react-native and react-native-lab,
  // we should use the one from node_modules for bare-expo.
  /\breact-native-lab\/react-native\/node_modules\b/,

  // Copied from expo-yarn-workspaces
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
  /\/versioned-react-native\//,
];

// To test test-suite from Expo Go, the react-native js source is from our fork.
config.serializer.getPolyfills = () => {
  const reactNativeRoot = path.join(
    monorepoRoot,
    'react-native-lab',
    'react-native',
    'packages',
    'react-native'
  );

  return require(path.join(reactNativeRoot, 'rn-get-polyfills'))();
};

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
  path.join(monorepoRoot, 'react-native-lab'), // Allow Metro to resolve `react-native-lab/react-native` files
  path.join(monorepoRoot, 'apps/common'), // Allow Metro to resolve common ThemeProvider
];

module.exports = config;
