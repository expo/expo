const fs = require('node:fs');
const path = require('node:path');

/**
 * Resolve the babel `configFile` option.
 */
function resolveBabelConfig(projectRoot) {
  // TODO(EvanBacon): We might want to disable babelrc lookup when the user specifies `enableBabelRCLookup: false`.
  const possibleBabelRCPaths = ['.babelrc', '.babelrc.js', 'babel.config.js'];
  const foundBabelRCPath = possibleBabelRCPaths.find((configFileName) =>
    fs.existsSync(path.resolve(process.cwd(), configFileName))
  );
  if (foundBabelRCPath) {
    // If the user has a babel config file, we should return null and use the default configFile resolution from babel.
    return null;
  }

  try {
    return require.resolve('babel-preset-expo');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

module.exports = {
  resolveBabelConfig,
};
