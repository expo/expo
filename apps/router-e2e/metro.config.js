/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const { boolish } = require('getenv');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(
  __dirname,
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

const monorepoRoot = path.join(__dirname, '../..');

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
];

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

// Allow experimental import support to be turned on through `EXPO_USE_METRO_REQUIRE=true` for E2E tests
config.transformer.getTransformOptions = () => ({
  transform: {
    experimentalImportSupport: boolish('EXPO_USE_METRO_REQUIRE', false),
    inlineRequires: false,
  },
});

config.resolver.blockList = [
  /\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

module.exports = config;
