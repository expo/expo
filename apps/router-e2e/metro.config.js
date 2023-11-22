const { createMetroConfiguration } = require('expo-yarn-workspaces');
const { FileStore } = require('@expo/metro-config/file-store');

// Find the project and workspace directories
const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = createMetroConfiguration(projectRoot);

const path = require('path');

const root = path.join(projectRoot, '../..');

config.watchFolders = [projectRoot, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

config.resolver.blockList = [
  ...config.resolver.blockList,

  /\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

config.cacheStores = [
  // Ensure the cache isn't shared between projects
  // this ensures the transform-time environment variables are changed to reflect
  // the current project.
  new FileStore({
    root: path.join(
      projectRoot,
      'node_modules/.cache/metro',
      process.env.E2E_ROUTER_SRC || 'app',
      // TODO: Move app.json to serializer instead of babel plugin.
      process.env.EXPO_E2E_BASE_PATH || '/'
    ),
  }),
];

module.exports = config;
