'use strict';

const { getDefaultConfig } = require('@expo/metro-config');
const debug = require('debug')('workspaces');
const path = require('path');

/**
 * Returns a configuration object in the format expected for "metro.config.js" files. The
 * configuration:
 *
 *   * excludes modules in the native Android and Xcode projects
 */
exports.createMetroConfiguration = function createMetroConfiguration(projectPath, options) {
  projectPath = path.resolve(projectPath);
  debug(`Creating a Metro configuration for the project at %s`, projectPath);
  const {
    // Remove the React Native reporter.
    reporter,
    ...defaultConfig
  } = getDefaultConfig(projectPath, options);

  return {
    ...defaultConfig,
    // Search for modules from the project's root directory
    projectRoot: projectPath,

    resolver: {
      ...defaultConfig.resolver,
      // test-suite includes a db asset
      assetExts: [...defaultConfig.resolver.assetExts, 'db'],

      // Ignore test files and JS files in the native Android and Xcode projects
      blockList: [
        /\/__tests__\//,
        /\/android\/React(Android|Common)\//,
        /\/versioned-react-native\//,
      ],
    },

    transformer: {
      ...defaultConfig.transformer,
      // Ignore file-relative Babel configurations and apply only the project's
      // NOTE: The Metro transformer still searches for and uses .babelrc and .babelrc.js files:
      // https://github.com/facebook/react-native/blob/753bb2094d95c8eb2152d2a2c1f0b67bbeec36de/packages/react-native-babel-transformer/src/index.js#L81
      // This is in contrast with Babel, which reads only babel.config.json before evaluating its
      // "babelrc" option: https://babeljs.io/docs/options#configfile
      enableBabelRCLookup: false,
    },
  };
};
