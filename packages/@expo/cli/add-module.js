const { loadModule } = require('@expo/require-utils');

/**
 * @deprecated Will be removed in a future release.
 */
module.exports = function importESM(name) {
  return loadModule(name);
};
