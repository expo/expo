/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
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

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

const originalCustomizeFrame = config.symbolicator.customizeFrame;
config.symbolicator.customizeFrame = (frame) => {
  const newFrame = originalCustomizeFrame(frame);
  // This will make frames collapsed the same as in use apps, where expo/packages are in node_modules
  // and thus collapsed by default.
  newFrame.collapse ||= new RegExp('expo/packages/.+').test(frame.file);
  return newFrame;
};

module.exports = config;
