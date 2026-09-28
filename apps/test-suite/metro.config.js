/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

if (process.env.E2E_FORCE_BABEL === '1') {
  config.transformer.babelTransformerPath =
    require.resolve('../router-e2e/forced-babel-transformer');
}

module.exports = config;
