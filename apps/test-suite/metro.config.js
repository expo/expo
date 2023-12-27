// Learn more https://docs.expo.dev/guides/customizing-metro/
/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const root = path.join(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'db' // See: ../test-suite/assets/asset-db.db
);

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
    root,
    'react-native-lab',
    'react-native',
    'packages',
    'react-native'
  );

  return require(path.join(reactNativeRoot, 'rn-get-polyfills'))();
};

// NOTE(brentvatne): This can be removed when
// https://github.com/facebook/metro/issues/290 is fixed.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    // When an asset is imported outside the project root, it has wrong path on Android
    // This happens for the back button in stack, so we fix the path to correct one
    const assets = '/node_modules/@react-navigation/stack/src/views/assets';

    if (req.url.startsWith(assets)) {
      req.url = req.url.replace(assets, `/assets/../..${assets}`);
    }

    // Same as above when testing anything required via Asset.downloadAsync() in test-suite
    const testSuiteAssets = '/test-suite/assets/';

    if (req.url.startsWith(testSuiteAssets)) {
      req.url = req.url.replace(testSuiteAssets, '/assets/../test-suite/assets/');
    }

    return middleware(req, res, next);
  };
};

module.exports = config;
