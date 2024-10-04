const { createMetroConfiguration } = require('expo-yarn-workspaces');
const path = require('path');

/* global __dirname */
const baseConfig = createMetroConfiguration(__dirname);

// To test home from Expo Go, the react-native js source is from our fork.
const reactNativeRoot = path.join(
  __dirname,
  '..',
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
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // When an asset is imported outside the project root, it has wrong path on Android
        // This happens for the back button in stack, so we fix the path to correct one
        const assets = '/node_modules/@react-navigation/elements/src/assets';

        if (req.url.startsWith(assets)) {
          req.url = req.url.replace(assets, `/assets/..${assets}`);
        }

        return middleware(req, res, next);
      };
    },
  },

  resolver: {
    ...baseConfig.resolver,
    blockList: [
      ...baseConfig.resolver.blockList,

      // Because react-native versions may be different between node_modules/react-native and react-native-lab,
      // metro and react-native cannot serve duplicated files from different paths.
      // Assuming home only serves for Expo Go,
      // the strategy here is to serve react-native imports from `react-native-lab/react-native` but not its transitive dependencies.
      // That is not ideal but should work for most cases if the two react-native versions do not have too much difference.
      // For example, `react-native-lab/react-native/node_modules/@react-native/polyfills` and `node_modules/@react-native/polyfills` may be different,
      // the metro config will use the transitive dependency from `node_modules/@react-native/polyfills`.
      /\breact-native-lab\/react-native\/node_modules\b/,
    ],
  },
  serializer: {
    ...baseConfig.serializer,
    getPolyfills: () => require(path.join(reactNativeRoot, 'rn-get-polyfills'))(),
  },
};
