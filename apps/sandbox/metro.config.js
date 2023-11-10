const { createMetroConfiguration } = require('expo-yarn-workspaces');

/** @type {import('expo/metro-config').MetroConfig} */
const config = createMetroConfiguration(__dirname, {
  isCSSEnabled: true,
});

const path = require('path');

const root = path.join(__dirname, '../..');

const pathToRegExp = require('path-to-regexp');
// config.watchFolders = [__dirname];
config.watchFolders = [__dirname];
// config.watchFolders = [__dirname, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

config.projectRoot = __dirname;
// config.server.unstable_serverRoot = __dirname;
// 66358
config.resolver.blacklistRE = [
  // This is default in metro and needs to be added back.
  /\/__tests__\/.*/,

  // /\/dist\//,
  // /\/\.expo\//,
  pathToRegExp(path.join(__dirname, 'dist'), { end: false }),
  pathToRegExp(path.join(__dirname, '.expo'), { end: false }),
  pathToRegExp(path.join(__dirname, 'node_modules'), { end: false }),
  // Ignore node_modules cache packages
  /\/node_modules\/\.*\//,
];
config.resolver.nodeModulesPaths = [];

console.log('REX:', __dirname, config.resolver.blacklistRE);

// 89934
config.resolver.blockList = [
  ...config.resolver.blockList,

  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /packages\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

module.exports = config;
