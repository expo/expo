const { createMetroConfiguration } = require('expo-yarn-workspaces');

/** @type {import('expo/metro-config').MetroConfig} */
const config = createMetroConfiguration(__dirname, {
  isCSSEnabled: true,
});

const path = require('path');

const root = path.join(__dirname, '../..');

config.resolver.unstable_enablePackageExports = true;

if (process.env._EXPO_NO_METRO_FILE_MAP_ERRORS) {
  config.watchFolders = [__dirname];

  // Can't ignore everything because that breaks require.context
  config.resolver.blacklistRE = [
    /\/__tests__\/.*/,
    /\/node_modules\//,
    /\/dist\//,
    /\/\.expo\//,

    // pathToRegExp(path.join(__dirname, 'dist'), { end: false }),
    // pathToRegExp(path.join(__dirname, '.expo'), { end: false }),
    // pathToRegExp(path.join(__dirname, 'node_modules'), { end: false }),
    // // Ignore node_modules cache packages
    // /\/node_modules\/\.*\//,
  ];
} else {
  config.watchFolders = [__dirname, ...['packages', 'node_modules'].map((v) => path.join(root, v))];
}

// 89934
config.resolver.blockList = [
  ...config.resolver.blockList,

  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /packages\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

module.exports = config;
