const { createMetroConfiguration } = require('expo-yarn-workspaces');

/** @type {import('expo/metro-config').MetroConfig} */
const config = createMetroConfiguration(__dirname, {
  isCSSEnabled: true,
});

const path = require('path');

const root = path.join(__dirname, '../..');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('my-custom-resolver:')) {
    // Logic to resolve the module name to a file path...
    // NOTE: Throw an error if there is no resolution.
    console.log('custom', moduleName);
    return {
      type: 'empty',
      // filePath: 'path/to/file',
      // type: 'sourceFile',
    };
  }
  // Optionally, chain to the standard Metro resolver.
  return context.resolveRequest(context, moduleName, platform);
};

config.watchFolders = [__dirname, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

config.resolver.blockList = [
  ...config.resolver.blockList,

  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /packages\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

module.exports = config;
