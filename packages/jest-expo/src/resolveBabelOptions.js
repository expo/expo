const fs = require('node:fs');
const path = require('node:path');

const BABEL_CONFIG_NAMES = [
  '.babelrc',
  '.babelrc.js',
  '.babelrc.cjs',
  '.babelrc.mjs',
  '.babelrc.json',
  '.babelrc.cts',
  'babel.config.js',
  'babel.config.cjs',
  'babel.config.mjs',
  'babel.config.json',
  'babel.config.cts',
  'babel.config.ts',
  'babel.config.mts',
];

function resolveBabelrcName(projectRoot) {
  // Check for various babel config files in the project root
  return BABEL_CONFIG_NAMES.find((configFileName) => {
    return fs.existsSync(path.resolve(projectRoot, configFileName));
  });
}

// NOTE(@kitten): Keep in sync with `@expo/metro-config/src/loadBabelConfig.ts`
const loadBabelConfig = (function () {
  const cache = new Map();

  return function _getBabelRC({ projectRoot, enableBabelRCLookup = true, extendsBabelConfigPath }) {
    let result = cache.get(projectRoot);
    if (result == null) {
      result = {};
      if (enableBabelRCLookup && extendsBabelConfigPath) {
        result.exts = path.resolve(projectRoot, extendsBabelConfigPath);
      } else if (projectRoot && enableBabelRCLookup) {
        // Check for various babel config files in the project root
        const foundBabelRCName = resolveBabelrcName(projectRoot);
        // Extend the config if a babel config file is found
        if (foundBabelRCName) {
          result.exts = path.resolve(projectRoot, foundBabelRCName);
        }
      }

      // Use the default preset for react-native if no babel config file is found
      if (!result.exts) {
        try {
          // NOTE(@kitten): Will need to prefer `projectRoot` manually
          const babelPresetPath = require.resolve('expo/internal/babel-preset', {
            paths: [projectRoot, __dirname],
          });
          result.presets = [babelPresetPath];
        } catch (error) {
          if (error.code === 'MODULE_NOT_FOUND') {
            result.presets = [require('babel-preset-expo')];
          } else {
            throw error;
          }
        }
      }
      cache.set(projectRoot, result);
    }
    return result;
  };
})();

function resolveBabelOptions(projectRoot = process.cwd()) {
  const babelConfigOpts = loadBabelConfig({
    projectRoot,
    enableBabelRCLookup: true,
    extendsBabelConfigPath: null,
  });
  return {
    root: projectRoot,
    babelrcRoots: projectRoot,
    babelrc: true,
    configFile: true,
    extends: babelConfigOpts.exts,
    presets: babelConfigOpts.presets,
    caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
  };
}

module.exports = {
  resolveBabelOptions,
};
