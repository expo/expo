// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

const root = path.join(__dirname, '../..');

config.watchFolders = [__dirname, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

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
config.resolver.assetExts.push('db');
config.transformer.enableBabelRCLookup = false;

module.exports = config;
