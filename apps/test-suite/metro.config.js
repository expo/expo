const { createMetroConfiguration } = require('expo-yarn-workspaces');
const path = require('path');
/* global __dirname */
const baseConfig = createMetroConfiguration(__dirname);

const root = path.join(__dirname, '../..');

const reactNativeRoot = path.join(
  root,
  'react-native-lab',
  'react-native',
  'packages',
  'react-native'
);

module.exports = {
  ...baseConfig,

  // NOTE(brentvatne): This can be removed when
  // https://github.com/facebook/metro/issues/290 is fixed.
  server: {
    ...baseConfig.server,
    enhanceMiddleware: (middleware) => {
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
    },
  },
  resolver: {
    ...baseConfig.resolver,
    assetExts: [...baseConfig.resolver.assetExts, 'kml'],
    blockList: [
      ...baseConfig.resolver.blockList,

      // Exclude react-native-lab from haste map.
      // Because react-native versions may be different between node_modules/react-native and react-native-lab,
      // we should use the one from node_modules for bare-expo.
      /\breact-native-lab\/react-native\/node_modules\b/,
    ],
  },
  serializer: {
    ...baseConfig.serializer,
    getPolyfills: () => require(path.join(reactNativeRoot, 'rn-get-polyfills'))(),
  },
};
