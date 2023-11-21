"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRunOncePlugin = createRunOncePlugin;
exports.withRunOnce = void 0;
function _history() {
  const data = require("../utils/history");
  _history = function () {
    return data;
  };
  return data;
}
/**
 * Prevents the same plugin from being run twice.
 * Used for migrating from unversioned expo config plugins to versioned plugins.
 *
 * @param config
 * @param name
 */
const withRunOnce = (config, {
  plugin,
  name,
  version
}) => {
  // Detect if a plugin has already been run on this config.
  if ((0, _history().getHistoryItem)(config, name)) {
    return config;
  }

  // Push the history item so duplicates cannot be run.
  config = (0, _history().addHistoryItem)(config, {
    name,
    version
  });
  return plugin(config);
};

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
exports.withRunOnce = withRunOnce;
function createRunOncePlugin(plugin, name, version) {
  return (config, props) => {
    return withRunOnce(config, {
      plugin: config => plugin(config, props),
      name,
      version
    });
  };
}
//# sourceMappingURL=withRunOnce.js.map