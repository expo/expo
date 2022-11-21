"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withStaticPlugin = void 0;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
    return data;
  };
  return data;
}
function _errors() {
  const data = require("../utils/errors");
  _errors = function () {
    return data;
  };
  return data;
}
function _pluginResolver() {
  const data = require("../utils/plugin-resolver");
  _pluginResolver = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const EXPO_DEBUG = (0, _getenv().boolish)('EXPO_DEBUG', false);

// Show all error info related to plugin resolution.
const EXPO_CONFIG_PLUGIN_VERBOSE_ERRORS = (0, _getenv().boolish)('EXPO_CONFIG_PLUGIN_VERBOSE_ERRORS', false);
// Force using the fallback unversioned plugin instead of a local versioned copy,
// this should only be used for testing the CLI.
const EXPO_USE_UNVERSIONED_PLUGINS = (0, _getenv().boolish)('EXPO_USE_UNVERSIONED_PLUGINS', false);
function isModuleMissingError(name, error) {
  // @ts-ignore
  if (['MODULE_NOT_FOUND', 'PLUGIN_NOT_FOUND'].includes(error.code)) {
    return true;
  }
  return error.message.includes(`Cannot find module '${name}'`);
}
function isUnexpectedTokenError(error) {
  if (error instanceof SyntaxError || error instanceof _errors().PluginError && error.code === 'INVALID_PLUGIN_IMPORT') {
    return (
      // These are the most common errors that'll be thrown when a package isn't transpiled correctly.
      !!error.message.match(/Unexpected token/) || !!error.message.match(/Cannot use import statement/)
    );
  }
  return false;
}

/**
 * Resolves static module plugin and potentially falls back on a provided plugin if the module cannot be resolved
 *
 * @param config
 * @param fallback Plugin with `_resolverError` explaining why the module couldn't be used
 * @param projectRoot optional project root, fallback to _internal.projectRoot. Used for testing.
 * @param _isLegacyPlugin Used to suppress errors thrown by plugins that are applied automatically
 */
const withStaticPlugin = (config, props) => {
  var _pluginProps;
  let projectRoot = props.projectRoot;
  if (!projectRoot) {
    var _config$_internal;
    projectRoot = (_config$_internal = config._internal) === null || _config$_internal === void 0 ? void 0 : _config$_internal.projectRoot;
    (0, _pluginResolver().assertInternalProjectRoot)(projectRoot);
  }
  let [pluginResolve, pluginProps] = (0, _pluginResolver().normalizeStaticPlugin)(props.plugin);
  // Ensure no one uses this property by accident.
  (0, _assert().default)(!((_pluginProps = pluginProps) !== null && _pluginProps !== void 0 && _pluginProps._resolverError), `Plugin property '_resolverError' is a reserved property of \`withStaticPlugin\``);
  let withPlugin;
  if (
  // Function was provided, no need to resolve: [withPlugin, {}]
  typeof pluginResolve === 'function') {
    withPlugin = pluginResolve;
  } else if (typeof pluginResolve === 'string') {
    try {
      // Resolve and evaluate plugins.
      withPlugin = (0, _pluginResolver().resolveConfigPluginFunction)(projectRoot, pluginResolve);

      // Only force if the project has the versioned plugin, otherwise use default behavior.
      // This helps see which plugins are being skipped.
      if (EXPO_USE_UNVERSIONED_PLUGINS && !!withPlugin && !!props._isLegacyPlugin && !!props.fallback) {
        console.log(`Force "${pluginResolve}" to unversioned plugin`);
        withPlugin = props.fallback;
      }
    } catch (error) {
      if (EXPO_DEBUG) {
        if (EXPO_CONFIG_PLUGIN_VERBOSE_ERRORS) {
          // Log the error in debug mode for plugins with fallbacks (like the Expo managed plugins).
          console.log(`Error resolving plugin "${pluginResolve}"`);
          console.log(error);
          console.log();
        } else {
          const shouldMuteWarning = props._isLegacyPlugin && (isModuleMissingError(pluginResolve, error) || isUnexpectedTokenError(error));
          if (!shouldMuteWarning) {
            if (isModuleMissingError(pluginResolve, error)) {
              // Prevent causing log spew for basic resolution errors.
              console.log(`Could not find plugin "${pluginResolve}"`);
            } else {
              // Log the error in debug mode for plugins with fallbacks (like the Expo managed plugins).
              console.log(`Error resolving plugin "${pluginResolve}"`);
              console.log(error);
              console.log();
            }
          }
        }
      }
      // TODO: Maybe allow for `PluginError`s to be thrown so external plugins can assert invalid options.

      // If the static module failed to resolve, attempt to use a fallback.
      // This enables support for built-in plugins with versioned variations living in other packages.
      if (props.fallback) {
        if (!pluginProps) pluginProps = {};
        // Pass this to the fallback plugin for potential warnings about needing to install a versioned package.
        pluginProps._resolverError = error;
        withPlugin = props.fallback;
      } else {
        // If no fallback, throw the resolution error.
        throw error;
      }
    }
  } else {
    throw new (_errors().PluginError)(`Plugin is an unexpected type: ${typeof pluginResolve}`, 'INVALID_PLUGIN_TYPE');
  }

  // Execute the plugin.
  config = withPlugin(config, pluginProps);
  return config;
};
exports.withStaticPlugin = withStaticPlugin;
//# sourceMappingURL=withStaticPlugin.js.map