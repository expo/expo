// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.join(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'kml' // See: ../native-component-list/assets/expo-maps/sample_kml.kml
);

config.resolver.blockList = [
  // Exclude react-native-lab from haste map.
  // Because react-native versions may be different between node_modules/react-native and react-native-lab,
  // we should use the one from node_modules for bare-expo.
  /\breact-native-lab\b/,

  // Copied from expo-yarn-workspaces
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
  /\/versioned-react-native\//,
];

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'apps/native-component-list'), // Allow Metro to resolve all files within NCL
  path.join(monorepoRoot, 'apps/test-suite'), // Allow Metro to resolve all files within test-suite
  path.join(monorepoRoot, 'apps/common'), // Allow Metro to resolve common ThemeProvider
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
];

module.exports = config;
