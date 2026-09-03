/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

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

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;
if (process.env.E2E_FORCE_BABEL === '1') {
  config.transformer.babelTransformerPath = require.resolve('./forced-babel-transformer');
}

module.exports = config;
