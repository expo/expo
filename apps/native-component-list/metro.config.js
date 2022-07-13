const { createMetroConfiguration } = require('expo-yarn-workspaces');

const baseConfig = createMetroConfiguration(__dirname);

if (process.env.EXPO_USE_EXOTIC) {
  // Use the custom transformer when exotic is enabled.
  baseConfig.transformer.babelTransformerPath = require.resolve('./metro.transformer.js');
}

module.exports = {
  ...baseConfig,

  // NOTE(brentvatne): This can be removed when
  // https://github.com/facebook/metro/issues/290 is fixed.
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // When an asset is imported outside the project root, it has wrong path on Android
        // This happens for the back button in stack, so we fix the path to correct one
        const assets = '/node_modules/@react-navigation/stack/src/views/assets';

        if (req.url.startsWith(assets)) {
          req.url = req.url.replace(assets, `/assets/../..${assets}`);
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
      // Assuming NCL only serves for Expo Go,
      // the strategy here is to serve react-native imports from `react-native-lab/react-native` but not its transitive dependencies.
      // That is not ideal but should work for most cases if the two react-native versions do not have too much difference.
      // For example, `react-native-lab/react-native/node_modules/@react-native/polyfills` and `node_modules/@react-native/polyfills` may be different,
      // the metro config will use the transitive dependency from `node_modules/@react-native/polyfills`.
      /\bnode_modules\/react-native\/\b/,
      /\breact-native-lab\/react-native\/node_modules\b/,
    ],
  },
};
