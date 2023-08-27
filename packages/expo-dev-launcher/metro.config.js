const { createMetroConfiguration } = require('expo-yarn-workspaces');
const path = require('path');

const config = createMetroConfiguration(__dirname);

const { EXPO_BUNDLE_APP } = process.env;

if (EXPO_BUNDLE_APP) {
  config.transformer.enableBabelRCLookup = true;
}

config.resolver.blockList.push(/\breact-native-lab\b/);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'ios' && /Components\/StatusBar\/StatusBar/.test(moduleName)) {
    console.log(`Replacing ${moduleName} with NOOP`);
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'bundle', 'StatusBarMock.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
