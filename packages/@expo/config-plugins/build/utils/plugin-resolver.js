"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertInternalProjectRoot = assertInternalProjectRoot;
exports.moduleNameIsDirectFileReference = moduleNameIsDirectFileReference;
exports.moduleNameIsPackageReference = moduleNameIsPackageReference;
exports.normalizeStaticPlugin = normalizeStaticPlugin;
exports.pluginFileName = void 0;
exports.resolveConfigPluginExport = resolveConfigPluginExport;
exports.resolveConfigPluginFunction = resolveConfigPluginFunction;
exports.resolveConfigPluginFunctionWithInfo = resolveConfigPluginFunctionWithInfo;
exports.resolvePluginForModule = resolvePluginForModule;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function path() {
  const data = _interopRequireWildcard(require("path"));
  path = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _errors() {
  const data = require("./errors");
  _errors = function () {
    return data;
  };
  return data;
}
function _modules() {
  const data = require("./modules");
  _modules = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Default plugin entry file name.
const pluginFileName = exports.pluginFileName = 'app.plugin.js';

/**
 * Resolve the config plugin from a node module or package.
 * If the module or package does not include a config plugin, this function throws a `PluginError`.
 * The resolution is done in following order:
 *   1. Is the reference a relative file path or an import specifier with file path? e.g. `./file.js`, `pkg/file.js` or `@org/pkg/file.js`?
 *     - Resolve the config plugin as-is
 *   2. If the reference a module? e.g. `expo-font`
 *     - Resolve the root `app.plugin.js` file within the module, e.g. `expo-font/app.plugin.js`
 *   3. Does the module have a valid config plugin in the `main` field?
 *     - Resolve the `main` entry point as config plugin
 */
function resolvePluginForModule(projectRoot, pluginReference) {
  if (moduleNameIsDirectFileReference(pluginReference)) {
    // Only resolve `./file.js`, `package/file.js`, `@org/package/file.js`
    const pluginScriptFile = _resolveFrom().default.silent(projectRoot, pluginReference);
    if (pluginScriptFile) {
      return {
        // NOTE(cedric): `path.sep` is required here, we are resolving the absolute path, not the plugin reference
        isPluginFile: pluginScriptFile.endsWith(path().sep + pluginFileName),
        filePath: pluginScriptFile
      };
    }
  } else if (moduleNameIsPackageReference(pluginReference)) {
    // Only resolve `package -> package/app.plugin.js`, `@org/package -> @org/package/app.plugin.js`
    const pluginPackageFile = _resolveFrom().default.silent(projectRoot, `${pluginReference}/${pluginFileName}`);
    if (pluginPackageFile && (0, _modules().fileExists)(pluginPackageFile)) {
      return {
        isPluginFile: true,
        filePath: pluginPackageFile
      };
    }
    // Try to resole the `main` entry as config plugin
    const packageMainEntry = _resolveFrom().default.silent(projectRoot, pluginReference);
    if (packageMainEntry) {
      return {
        isPluginFile: false,
        filePath: packageMainEntry
      };
    }
  }
  throw new (_errors().PluginError)(`Failed to resolve plugin for module "${pluginReference}" relative to "${projectRoot}"`, 'PLUGIN_NOT_FOUND');
}

// TODO: Test windows
function pathIsFilePath(name) {
  // Matches lines starting with: . / ~/
  return !!name.match(/^(\.|~\/|\/)/g);
}
function moduleNameIsDirectFileReference(name) {
  if (pathIsFilePath(name)) {
    return true;
  }
  const slashCount = name.split('/')?.length;
  // Orgs (like @expo/config ) should have more than one slash to be a direct file.
  if (name.startsWith('@')) {
    return slashCount > 2;
  }

  // Regular packages should be considered direct reference if they have more than one slash.
  return slashCount > 1;
}
function moduleNameIsPackageReference(name) {
  const slashCount = name.split('/')?.length;
  return name.startsWith('@') ? slashCount === 2 : slashCount === 1;
}
function normalizeStaticPlugin(plugin) {
  if (Array.isArray(plugin)) {
    (0, _assert().default)(plugin.length > 0 && plugin.length < 3, `Wrong number of arguments provided for static config plugin, expected either 1 or 2, got ${plugin.length}`);
    return plugin;
  }
  return [plugin, undefined];
}
function assertInternalProjectRoot(projectRoot) {
  (0, _assert().default)(projectRoot, `Unexpected: Config \`_internal.projectRoot\` isn't defined by expo-cli, this is a bug.`);
}

// Resolve the module function and assert type
function resolveConfigPluginFunction(projectRoot, pluginReference) {
  const {
    plugin
  } = resolveConfigPluginFunctionWithInfo(projectRoot, pluginReference);
  return plugin;
}

// Resolve the module function and assert type
function resolveConfigPluginFunctionWithInfo(projectRoot, pluginReference) {
  const {
    filePath: pluginFile,
    isPluginFile
  } = resolvePluginForModule(projectRoot, pluginReference);
  let result;
  try {
    result = requirePluginFile(pluginFile);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`;
      // If the plugin reference is a node module, and that node module has a syntax error, then it probably doesn't have an official config plugin.
      if (!isPluginFile && !moduleNameIsDirectFileReference(pluginReference)) {
        const pluginError = new (_errors().PluginError)(`Package "${pluginReference}" does not contain a valid config plugin.\n${learnMoreLink}\n\n${error.message}`, 'INVALID_PLUGIN_IMPORT');
        pluginError.stack = error.stack;
        throw pluginError;
      }
    }
    throw error;
  }
  const plugin = resolveConfigPluginExport({
    plugin: result,
    pluginFile,
    pluginReference,
    isPluginFile
  });
  return {
    plugin,
    pluginFile,
    pluginReference,
    isPluginFile
  };
}

/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param props.plugin plugin results
 * @param props.pluginFile plugin file path
 * @param props.pluginReference the string used to reference the plugin
 * @param props.isPluginFile is file path from the app.plugin.js module root
 */
function resolveConfigPluginExport({
  plugin,
  pluginFile,
  pluginReference,
  isPluginFile
}) {
  if (plugin.default != null) {
    plugin = plugin.default;
  }
  if (typeof plugin !== 'function') {
    const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`;
    // If the plugin reference is a node module, and that node module does not export a function then it probably doesn't have a config plugin.
    if (!isPluginFile && !moduleNameIsDirectFileReference(pluginReference)) {
      throw new (_errors().PluginError)(`Package "${pluginReference}" does not contain a valid config plugin. Module must export a function from file: ${pluginFile}\n${learnMoreLink}`, 'INVALID_PLUGIN_TYPE');
    }
    throw new (_errors().PluginError)(`Plugin "${pluginReference}" must export a function from file: ${pluginFile}. ${learnMoreLink}`, 'INVALID_PLUGIN_TYPE');
  }
  return plugin;
}
function requirePluginFile(filePath) {
  try {
    return require(filePath);
  } catch (error) {
    // TODO: Improve error messages
    throw error;
  }
}
//# sourceMappingURL=plugin-resolver.js.map