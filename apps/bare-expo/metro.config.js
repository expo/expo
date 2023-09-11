const { createMetroConfiguration } = require('expo-yarn-workspaces');

const baseConfig = createMetroConfiguration(__dirname);

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
      /\breact-native-lab\b/,
    ],
  },
};
