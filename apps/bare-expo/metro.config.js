// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const root = path.join(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'db', // See: ../test-suite/assets/asset-db.db
  'kml' // See: ../native-component-list/assets/expp-maps/sample_kml.kml
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

// Explicitly set all folders that needs to be watched
// This is an optimization to avoid Metro watching the whole monorepo
config.watchFolders = [
  __dirname,
  ...['packages', 'apps/test-suite', 'apps/native-component-list', 'node_modules'].map((v) =>
    path.join(root, v)
  ),
];

// NOTE(brentvatne): This can be removed when
// https://github.com/facebook/metro/issues/290 is fixed.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    // When an asset is imported outside the project root, it has wrong path on Android
    // This happens for the back button in stack, so we fix the path to correct one
    const assets = '/node_modules/@react-navigation/elements/src/assets';

    if (req.url.startsWith(assets)) {
      req.url = req.url.replace(assets, `/assets/../..${assets}`);
    }

    // Same as above when testing anything required via Asset.downloadAsync() in test-suite
    const testSuiteAssets = '/test-suite/assets/';

    if (req.url.startsWith(testSuiteAssets)) {
      req.url = req.url.replace(testSuiteAssets, '/assets/../test-suite/assets/');
    }

    const nclAssets = '/native-component-list/';

    if (req.url.startsWith(nclAssets)) {
      req.url = req.url.replace(nclAssets, '/assets/../native-component-list/');
    }

    return middleware(req, res, next);
  };
};

module.exports = config;
