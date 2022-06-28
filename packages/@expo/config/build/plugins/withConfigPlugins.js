"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withConfigPlugins = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
    return data;
  };

  return data;
}

function _Serialize() {
  const data = require("../Serialize");

  _Serialize = function () {
    return data;
  };

  return data;
}

/**
 * Resolves static plugins array as config plugin functions.
 *
 * @param config
 * @param projectRoot
 */
const withConfigPlugins = (config, skipPlugins) => {
  var _config$plugins;

  // @ts-ignore: plugins not on config type yet -- TODO
  if (!Array.isArray(config.plugins) || !((_config$plugins = config.plugins) !== null && _config$plugins !== void 0 && _config$plugins.length)) {
    return config;
  }

  if (!skipPlugins) {
    // Resolve and evaluate plugins
    // @ts-ignore: TODO: add plugins to the config schema
    config = (0, _configPlugins().withPlugins)(config, config.plugins);
  } else {
    // Delete the plugins array in case someone added functions or other values which cannot be automatically serialized.
    delete config.plugins;
  } // plugins aren't serialized by default, serialize the plugins after resolving them.


  return (0, _Serialize().serializeAfterStaticPlugins)(config);
};

exports.withConfigPlugins = withConfigPlugins;
//# sourceMappingURL=withConfigPlugins.js.map