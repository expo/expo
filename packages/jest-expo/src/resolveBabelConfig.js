const { resolveBabelrcName } = require('@expo/metro-config/build/loadBabelConfig');
const path = require('node:path');

/**
 * Resolve the babel options that match Expo CLI's project-root config lookup.
 */
function resolveBabelConfig(projectRoot) {
  const foundBabelRCName = resolveBabelrcName(projectRoot);
  if (foundBabelRCName) {
    return {
      extends: path.resolve(projectRoot, foundBabelRCName),
    };
  }

  try {
    return {
      configFile: require.resolve('expo/internal/babel-preset', {
        paths: [projectRoot, __dirname],
      }),
    };
  } catch {
    try {
      // TODO(@kitten): Temporary, since our E2E tests don't use monorepo
      // packages consistently, including the `expo` package
      return {
        configFile: require.resolve('babel-preset-expo'),
      };
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        return {};
      }
      throw error;
    }
  }
}

module.exports = {
  resolveBabelConfig,
};
