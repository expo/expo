const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Copied from expo-yarn-workspaces
config.transformer.enableBabelRCLookup = false;
config.resolver.assetExts.push('db');
config.resolver.blockList = [
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
  /\/versioned-react-native\//,
];

module.exports = config;
