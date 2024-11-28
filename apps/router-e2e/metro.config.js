// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { boolish } = require('getenv');

// Find the project and workspace directories
const projectRoot = __dirname;

const config = getDefaultConfig(
  projectRoot,

  require('getenv').boolish('E2E_USE_MOCK_SERIALIZER_PLUGINS', false)
    ? {
        // Mock the serializer plugins to inject a virtual module. This ensures that we compute correct source maps with tools like sentry.
        unstable_beforeAssetSerializationPlugins: [
          ({ premodules, debugId }) => {
            if (!debugId) {
              return premodules;
            }
            const src = '// MOCK INJECTED VALUE';
            return [
              // Return a mock module.
              {
                dependencies: new Map(),
                getSource: () => Buffer.from(src),
                inverseDependencies: new Set(),
                path: '__debugid__',
                output: [
                  {
                    type: 'js/script/virtual',
                    data: {
                      code: src,
                      lineCount: 1,
                      map: [],
                    },
                  },
                ],
              },
            ];
          },
        ],
      }
    : undefined
);

const root = path.join(projectRoot, '../..');

config.watchFolders = [projectRoot, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

config.resolver.blockList = [
  // Copied from expo-yarn-workspaces
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
  /\/versioned-react-native\//,

  /\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

// Copied from expo-yarn-workspaces
config.transformer.enableBabelRCLookup = false;

config.transformer.getTransformOptions = () => ({
  transform: {
    experimentalImportSupport: boolish('EXPO_USE_METRO_REQUIRE', false),
    inlineRequires: false,
  },
});

module.exports = config;
