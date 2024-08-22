const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.join(__dirname, '../..');
const baseConfig = getDefaultConfig(__dirname);

/** @type {import('expo/metro-config').MetroConfig} */
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
          req.url = req.url.replace(assets, `/assets/..${assets}`);
        }

        return middleware(req, res, next);
      };
    },
  },

  resolver: {
    ...baseConfig.resolver,
    blockList: [
      // Copied from expo-yarn-workspaces
      /\/__tests__\//,
      /\/android\/React(Android|Common)\//,
      /\/versioned-react-native\//,

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
    // To test NCL from Expo Go, the react-native js source is from our fork.
    getPolyfills: () => {
      const reactNativeRoot = path.join(
        monorepoRoot,
        'react-native-lab',
        'react-native',
        'packages',
        'react-native'
      );

      return require(path.join(reactNativeRoot, 'rn-get-polyfills'))();
    },
  },
  transformer: {
    ...baseConfig.transformer,
    // Copied from expo-yarn-workspaces
    // Ignore file-relative Babel configurations and apply only the project's
    // NOTE: The Metro transformer still searches for and uses .babelrc and .babelrc.js files:
    // https://github.com/facebook/react-native/blob/753bb2094d95c8eb2152d2a2c1f0b67bbeec36de/packages/react-native-babel-transformer/src/index.js#L81
    // This is in contrast with Babel, which reads only babel.config.json before evaluating its
    // "babelrc" option: https://babeljs.io/docs/options#configfile
    enableBabelRCLookup: false,
  },
};
