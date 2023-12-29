const { getDefaultConfig } = require('expo/metro-config');

// Find the project and workspace directories
const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot, {
  isCSSEnabled: true,
});

const path = require('path');

const root = path.join(projectRoot, '../../..');

config.resolver.unstable_enablePackageExports = true;
config.watchFolders = [projectRoot, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

config.resolver.blockList = [
  // ...config.resolver.blockList,

  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /packages\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

module.exports = config;
