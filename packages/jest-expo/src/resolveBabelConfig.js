const fs = require('node:fs');
const path = require('node:path');

/**
 * Resolve the babel `configFile` option.
 */
function resolveBabelConfig(projectRoot) {
  // Project-wide configs (babel.config.*) apply to all files including those
  // in node_modules, so Babel's default resolution handles everything.
  const projectWideConfigs = ['babel.config.js', 'babel.config.cjs', 'babel.config.mjs', 'babel.config.json'];
  const hasProjectWideConfig = projectWideConfigs.some((configFileName) =>
    fs.existsSync(path.resolve(projectRoot, configFileName))
  );
  if (hasProjectWideConfig) {
    return null;
  }

  // Directory-scoped configs (.babelrc, .babelrc.js) only apply to files
  // within their directory tree. They won't transform files outside that tree
  // (e.g. node_modules/react-native/jest/setup.js), so we must still provide
  // the expo babel preset via configFile.

  try {
    return require.resolve('expo/internal/babel-preset');
  } catch {
    try {
      // TODO(@kitten): Temporary, since our E2E tests don't use monorepo
      // packages consistently, including the `expo` package
      return require.resolve('babel-preset-expo');
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }
}

module.exports = {
  resolveBabelConfig,
};
