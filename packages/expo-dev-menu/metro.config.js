const { createMetroConfiguration } = require('expo-yarn-workspaces');

const config = createMetroConfiguration(__dirname);

const { EXPO_BUNDLE_APP } = process.env;

if (EXPO_BUNDLE_APP) {
  config.transformer.enableBabelRCLookup = true;
}

module.exports = config;
