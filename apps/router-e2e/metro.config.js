const { createMetroConfiguration } = require('expo-yarn-workspaces');
const { FileStore } = require('metro-cache');

// Find the project and workspace directories
const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = createMetroConfiguration(projectRoot);

const path = require('path');

const root = path.join(projectRoot, '../..');

config.watchFolders = [projectRoot, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

config.resolver.blockList = [
  ...config.resolver.blockList,

  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /packages\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

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
