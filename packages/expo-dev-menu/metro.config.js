const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const { EXPO_BUNDLE_APP } = process.env;

if (EXPO_BUNDLE_APP) {
  config.transformer.enableBabelRCLookup = true;
} else {
  // Copied from expo-yarn-workspaces
  config.transformer.enableBabelRCLookup = false;
}

config.resolver.blockList = [
  // Copied from expo-yarn-workspaces
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
  /\/versioned-react-native\//,

  /\breact-native-lab\b/,
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'ios' && /Components\/StatusBar\/StatusBar/.test(moduleName)) {
    console.log(`Replacing ${moduleName} with NOOP`);
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'app', 'StatusBarMock.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Copied from expo-yarn-workspaces
config.resolver.assetExts.push('db');

module.exports = config;
