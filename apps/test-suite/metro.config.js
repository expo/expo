/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const baseConfig = getDefaultConfig(__dirname);

const root = path.join(__dirname, '../..');

const reactNativeRoot = path.join(
  root,
  'react-native-lab',
  'react-native',
  'packages',
  'react-native'
);

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
    assetExts: [
      ...baseConfig.resolver.assetExts,
      'db', // Copied from expo-yarn-workspaces
      'kml',
    ],
    blockList: [
      // Copied from expo-yarn-workspaces
      /\/__tests__\//,
      /\/android\/React(Android|Common)\//,
      /\/versioned-react-native\//,

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
