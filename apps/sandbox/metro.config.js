// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
// const { boolish } = require('getenv');

const config = getDefaultConfig(__dirname);

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

// const isRSC = boolish('E2E_RSC_ENABLED', false);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-router/entry') {
    // Prevent loading the routes in client-first mode with the standard require.context module.
    moduleName = 'expo-router/entry-rsc';
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
