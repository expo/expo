"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertInternalProjectRoot = assertInternalProjectRoot;
exports.moduleNameIsDirectFileReference = moduleNameIsDirectFileReference;
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

function _findUp() {
  const data = _interopRequireDefault(require("find-up"));

  _findUp = function () {
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

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Default plugin entry file name.
const pluginFileName = 'app.plugin.js';
exports.pluginFileName = pluginFileName;

function findUpPackageJson(root) {
  const packageJson = _findUp().default.sync('package.json', {
    cwd: root
  });

  (0, _assert().default)(packageJson, `No package.json found for module "${root}"`);
  return packageJson;
}

function resolvePluginForModule(projectRoot, modulePath) {
  const resolved = _resolveFrom().default.silent(projectRoot, modulePath);

  if (!resolved) {
    throw new (_errors().PluginError)(`Failed to resolve plugin for module "${modulePath}" relative to "${projectRoot}"`, 'PLUGIN_NOT_FOUND');
  } // If the modulePath is something like `@bacon/package/index.js` or `expo-foo/build/app`
  // then skip resolving the module `app.plugin.js`


  if (moduleNameIsDirectFileReference(modulePath)) {
    return {
      isPluginFile: false,
      filePath: resolved
    };
  }

  return findUpPlugin(resolved);
} // TODO: Test windows


function pathIsFilePath(name) {
  // Matches lines starting with: . / ~/
  return !!name.match(/^(\.|~\/|\/)/g);
}

function moduleNameIsDirectFileReference(name) {
  var _name$split;

  if (pathIsFilePath(name)) {
    return true;
  }

  const slashCount = (_name$split = name.split(path().sep)) === null || _name$split === void 0 ? void 0 : _name$split.length; // Orgs (like @expo/config ) should have more than one slash to be a direct file.

  if (name.startsWith('@')) {
    return slashCount > 2;
  } // Regular packages should be considered direct reference if they have more than one slash.


  return slashCount > 1;
}

function resolveExpoPluginFile(root) {
  // Find the expo plugin root file
  const pluginModuleFile = _resolveFrom().default.silent(root, // use ./ so it isn't resolved as a node module
  `./${pluginFileName}`); // If the default expo plugin file exists use it.


  if (pluginModuleFile && (0, _modules().fileExists)(pluginModuleFile)) {
    return pluginModuleFile;
  }

  return null;
}

function findUpPlugin(root) {
  // Get the closest package.json to the node module
  const packageJson = findUpPackageJson(root); // resolve the root folder for the node module

  const moduleRoot = path().dirname(packageJson); // use whatever the initial resolved file was ex: `node_modules/my-package/index.js` or `./something.js`

  const pluginFile = resolveExpoPluginFile(moduleRoot);
  return {
    filePath: pluginFile !== null && pluginFile !== void 0 ? pluginFile : root,
    isPluginFile: !!pluginFile
  };
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
} // Resolve the module function and assert type


function resolveConfigPluginFunction(projectRoot, pluginReference) {
  const {
    plugin
  } = resolveConfigPluginFunctionWithInfo(projectRoot, pluginReference);
  return plugin;
} // Resolve the module function and assert type


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
      const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`; // If the plugin reference is a node module, and that node module has a syntax error, then it probably doesn't have an official config plugin.

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
    const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`; // If the plugin reference is a node module, and that node module does not export a function then it probably doesn't have a config plugin.

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