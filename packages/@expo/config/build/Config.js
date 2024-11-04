"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  getConfig: true,
  getPackageJson: true,
  getConfigFilePaths: true,
  modifyConfigAsync: true,
  getWebOutputPath: true,
  getNameFromConfig: true,
  getDefaultTarget: true,
  getProjectConfigDescription: true,
  getProjectConfigDescriptionWithPaths: true
};
exports.getConfig = getConfig;
exports.getConfigFilePaths = getConfigFilePaths;
exports.getDefaultTarget = getDefaultTarget;
exports.getNameFromConfig = getNameFromConfig;
exports.getPackageJson = getPackageJson;
exports.getProjectConfigDescription = getProjectConfigDescription;
exports.getProjectConfigDescriptionWithPaths = getProjectConfigDescriptionWithPaths;
exports.getWebOutputPath = getWebOutputPath;
exports.modifyConfigAsync = modifyConfigAsync;
function _jsonFile() {
  const data = _interopRequireDefault(require("@expo/json-file"));
  _jsonFile = function () {
    return data;
  };
  return data;
}
function _deepmerge() {
  const data = _interopRequireDefault(require("deepmerge"));
  _deepmerge = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _glob() {
  const data = require("glob");
  _glob = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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
function _semver() {
  const data = _interopRequireDefault(require("semver"));
  _semver = function () {
    return data;
  };
  return data;
}
function _slugify() {
  const data = _interopRequireDefault(require("slugify"));
  _slugify = function () {
    return data;
  };
  return data;
}
function _getConfig() {
  const data = require("./getConfig");
  _getConfig = function () {
    return data;
  };
  return data;
}
function _getExpoSDKVersion() {
  const data = require("./getExpoSDKVersion");
  _getExpoSDKVersion = function () {
    return data;
  };
  return data;
}
function _withConfigPlugins() {
  const data = require("./plugins/withConfigPlugins");
  _withConfigPlugins = function () {
    return data;
  };
  return data;
}
function _withInternal() {
  const data = require("./plugins/withInternal");
  _withInternal = function () {
    return data;
  };
  return data;
}
function _resolvePackageJson() {
  const data = require("./resolvePackageJson");
  _resolvePackageJson = function () {
    return data;
  };
  return data;
}
var _Config = require("./Config.types");
Object.keys(_Config).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _Config[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Config[key];
    }
  });
});
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
let hasWarnedAboutRootConfig = false;

/**
 * If a config has an `expo` object then that will be used as the config.
 * This method reduces out other top level values if an `expo` object exists.
 *
 * @param config Input config object to reduce
 */
function reduceExpoObject(config) {
  if (!config) return config === undefined ? null : config;
  if (config.expo && !hasWarnedAboutRootConfig) {
    const keys = Object.keys(config).filter(key => key !== 'expo');
    if (keys.length) {
      hasWarnedAboutRootConfig = true;
      const ansiYellow = str => `\u001B[33m${str}\u001B[0m`;
      const ansiGray = str => `\u001B[90m${str}\u001B[0m`;
      const ansiBold = str => `\u001B[1m${str}\u001B[22m`;
      const plural = keys.length > 1;
      console.warn(ansiYellow(ansiBold('Warning: ') + `Root-level ${ansiBold(`"expo"`)} object found. Ignoring extra key${plural ? 's' : ''} in Expo config: ${keys.map(key => `"${key}"`).join(', ')}\n` + ansiGray(`Learn more: https://expo.fyi/root-expo-object`)));
    }
  }
  const {
    mods,
    ...expo
  } = config.expo ?? config;
  return {
    expo,
    mods
  };
}

/**
 * Get all platforms that a project is currently capable of running.
 *
 * @param projectRoot
 * @param exp
 */
function getSupportedPlatforms(projectRoot) {
  const platforms = [];
  if (_resolveFrom().default.silent(projectRoot, 'react-native')) {
    platforms.push('ios', 'android');
  }
  if (_resolveFrom().default.silent(projectRoot, 'react-dom')) {
    platforms.push('web');
  }
  return platforms;
}

/**
 * Evaluate the config for an Expo project.
 * If a function is exported from the `app.config.js` then a partial config will be passed as an argument.
 * The partial config is composed from any existing app.json, and certain fields from the `package.json` like name and description.
 *
 * If options.isPublicConfig is true, the Expo config will include only public-facing options (omitting private keys).
 * The resulting config should be suitable for hosting or embedding in a publicly readable location.
 *
 * **Example**
 * ```js
 * module.exports = function({ config }) {
 *   // mutate the config before returning it.
 *   config.slug = 'new slug'
 *   return { expo: config };
 * }
 * ```
 *
 * **Supports**
 * - `app.config.ts`
 * - `app.config.js`
 * - `app.config.json`
 * - `app.json`
 *
 * @param projectRoot the root folder containing all of your application code
 * @param options enforce criteria for a project config
 */
function getConfig(projectRoot, options = {}) {
  const paths = getConfigFilePaths(projectRoot);
  const rawStaticConfig = paths.staticConfigPath ? (0, _getConfig().getStaticConfig)(paths.staticConfigPath) : null;
  // For legacy reasons, always return an object.
  const rootConfig = rawStaticConfig || {};
  const staticConfig = reduceExpoObject(rawStaticConfig) || {};

  // Can only change the package.json location if an app.json or app.config.json exists
  const [packageJson, packageJsonPath] = getPackageJsonAndPath(projectRoot);
  function fillAndReturnConfig(config, dynamicConfigObjectType, mayHaveUnusedStaticConfig = false) {
    const configWithDefaultValues = {
      ...ensureConfigHasDefaultValues({
        projectRoot,
        exp: config.expo,
        pkg: packageJson,
        skipSDKVersionRequirement: options.skipSDKVersionRequirement,
        paths,
        packageJsonPath
      }),
      mods: config.mods,
      dynamicConfigObjectType,
      rootConfig,
      dynamicConfigPath: paths.dynamicConfigPath,
      staticConfigPath: paths.staticConfigPath,
      hasUnusedStaticConfig: !!paths.staticConfigPath && !!paths.dynamicConfigPath && mayHaveUnusedStaticConfig
    };
    if (options.isModdedConfig) {
      // @ts-ignore: Add the mods back to the object.
      configWithDefaultValues.exp.mods = config.mods ?? null;
    }

    // Apply static json plugins, should be done after _internal
    configWithDefaultValues.exp = (0, _withConfigPlugins().withConfigPlugins)(configWithDefaultValues.exp, !!options.skipPlugins);
    if (!options.isModdedConfig) {
      // @ts-ignore: Delete mods added by static plugins when they won't have a chance to be evaluated
      delete configWithDefaultValues.exp.mods;
    }
    if (options.isPublicConfig) {
      // TODD(EvanBacon): Drop plugins array after it's been resolved.

      // Remove internal values with references to user's file paths from the public config.
      delete configWithDefaultValues.exp._internal;

      // hooks no longer exists in the typescript type but should still be removed
      if ('hooks' in configWithDefaultValues.exp) {
        delete configWithDefaultValues.exp.hooks;
      }
      if (configWithDefaultValues.exp.ios?.config) {
        delete configWithDefaultValues.exp.ios.config;
      }
      if (configWithDefaultValues.exp.android?.config) {
        delete configWithDefaultValues.exp.android.config;
      }
      delete configWithDefaultValues.exp.updates?.codeSigningCertificate;
      delete configWithDefaultValues.exp.updates?.codeSigningMetadata;
    }
    return configWithDefaultValues;
  }

  // Fill in the static config
  function getContextConfig(config) {
    return ensureConfigHasDefaultValues({
      projectRoot,
      exp: config.expo,
      pkg: packageJson,
      skipSDKVersionRequirement: true,
      paths,
      packageJsonPath
    }).exp;
  }
  if (paths.dynamicConfigPath) {
    // No app.config.json or app.json but app.config.js
    const {
      exportedObjectType,
      config: rawDynamicConfig,
      mayHaveUnusedStaticConfig
    } = (0, _getConfig().getDynamicConfig)(paths.dynamicConfigPath, {
      projectRoot,
      staticConfigPath: paths.staticConfigPath,
      packageJsonPath,
      config: getContextConfig(staticConfig)
    });
    // Allow for the app.config.js to `export default null;`
    // Use `dynamicConfigPath` to detect if a dynamic config exists.
    const dynamicConfig = reduceExpoObject(rawDynamicConfig) || {};
    return fillAndReturnConfig(dynamicConfig, exportedObjectType, mayHaveUnusedStaticConfig);
  }

  // No app.config.js but json or no config
  return fillAndReturnConfig(staticConfig || {}, null);
}
function getPackageJson(projectRoot) {
  const [pkg] = getPackageJsonAndPath(projectRoot);
  return pkg;
}
function getPackageJsonAndPath(projectRoot) {
  const packageJsonPath = (0, _resolvePackageJson().getRootPackageJsonPath)(projectRoot);
  return [_jsonFile().default.read(packageJsonPath), packageJsonPath];
}

/**
 * Get the static and dynamic config paths for a project. Also accounts for custom paths.
 *
 * @param projectRoot
 */
function getConfigFilePaths(projectRoot) {
  return {
    dynamicConfigPath: getDynamicConfigFilePath(projectRoot),
    staticConfigPath: getStaticConfigFilePath(projectRoot)
  };
}
function getDynamicConfigFilePath(projectRoot) {
  for (const fileName of ['app.config.ts', 'app.config.js']) {
    const configPath = _path().default.join(projectRoot, fileName);
    if (_fs().default.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}
function getStaticConfigFilePath(projectRoot) {
  for (const fileName of ['app.config.json', 'app.json']) {
    const configPath = _path().default.join(projectRoot, fileName);
    if (_fs().default.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Attempt to modify an Expo project config.
 * This will only fully work if the project is using static configs only.
 * Otherwise 'warn' | 'fail' will return with a message about why the config couldn't be updated.
 * The potentially modified config object will be returned for testing purposes.
 *
 * @param projectRoot
 * @param modifications modifications to make to an existing config
 * @param readOptions options for reading the current config file
 * @param writeOptions If true, the static config file will not be rewritten
 */
async function modifyConfigAsync(projectRoot, modifications, readOptions = {}, writeOptions = {}) {
  const config = getConfig(projectRoot, readOptions);
  const isDryRun = writeOptions.dryRun;

  // Create or modify the static config, when not using dynamic config
  if (!config.dynamicConfigPath) {
    const outputConfig = mergeConfigModifications(config, modifications);
    if (!isDryRun) {
      const configPath = config.staticConfigPath ?? _path().default.join(projectRoot, 'app.json');
      await _jsonFile().default.writeAsync(configPath, outputConfig, {
        json5: false
      });
    }
    return {
      type: 'success',
      config: outputConfig.expo ?? outputConfig
    };
  }

  // Attempt to write to a function-like dynamic config, when used with a static config
  if (config.staticConfigPath && config.dynamicConfigObjectType === 'function') {
    const outputConfig = mergeConfigModifications(config, modifications);
    if (isDryRun) {
      return {
        type: 'warn',
        message: `Cannot verify config modifications in dry-run mode for config at: ${_path().default.relative(projectRoot, config.dynamicConfigPath)}`,
        config: null
      };
    }

    // Attempt to write the static config with the config modifications
    await _jsonFile().default.writeAsync(config.staticConfigPath, outputConfig, {
      json5: false
    });

    // Verify that the dynamic config is using the static config
    const newConfig = getConfig(projectRoot, readOptions);
    const newConfighasModifications = isMatchingObject(modifications, newConfig.exp);
    if (newConfighasModifications) {
      return {
        type: 'success',
        config: newConfig.exp
      };
    }

    // Rollback the changes when the reloaded config did not include the modifications
    await _jsonFile().default.writeAsync(config.staticConfigPath, config.rootConfig, {
      json5: false
    });
  }

  // We cannot automatically write to a dynamic config
  return {
    type: 'warn',
    message: `Cannot automatically write to dynamic config at: ${_path().default.relative(projectRoot, config.dynamicConfigPath)}`,
    config: null
  };
}

/**
 * Merge the config modifications, using an optional possible top-level `expo` object.
 * Note, changes in the plugins are merged differently to avoid duplicate entries.
 */
function mergeConfigModifications(config, {
  plugins,
  ...modifications
}) {
  const modifiedExpoConfig = !config.rootConfig.expo ? (0, _deepmerge().default)(config.rootConfig, modifications) : (0, _deepmerge().default)(config.rootConfig.expo, modifications);
  if (plugins?.length) {
    // When adding plugins, ensure the config has a plugin list
    if (!modifiedExpoConfig.plugins) {
      modifiedExpoConfig.plugins = [];
    }

    // Create a plugin lookup map
    const existingPlugins = Object.fromEntries(modifiedExpoConfig.plugins.map(definition => typeof definition === 'string' ? [definition, undefined] : definition));
    for (const plugin of plugins) {
      // Unpack the plugin definition, using either the short (string) or normal (array) notation
      const [pluginName, pluginProps] = Array.isArray(plugin) ? plugin : [plugin];
      // Abort if the plugin definition is empty
      if (!pluginName) continue;

      // Add the plugin if it doesn't exist yet, including its properties
      if (!(pluginName in existingPlugins)) {
        modifiedExpoConfig.plugins.push(plugin);
        continue;
      }

      // If the plugin has properties, and it exists, merge the properties
      if (pluginProps) {
        modifiedExpoConfig.plugins = modifiedExpoConfig.plugins.map(existingPlugin => {
          const [existingPluginName] = Array.isArray(existingPlugin) ? existingPlugin : [existingPlugin];

          // Do not modify other plugins
          if (existingPluginName !== pluginName) {
            return existingPlugin;
          }

          // Add the props to the existing plugin entry
          if (typeof existingPlugin === 'string') {
            return [existingPlugin, pluginProps];
          }

          // Merge the props to the existing plugin properties
          if (Array.isArray(existingPlugin) && existingPlugin[0]) {
            return [existingPlugin[0], (0, _deepmerge().default)(existingPlugin[1] ?? {}, pluginProps)];
          }
          return existingPlugin;
        });
        continue;
      }

      // If the same plugin exists with properties, and the modification does not contain properties, ignore
    }
  }
  const finalizedConfig = !config.rootConfig.expo ? modifiedExpoConfig : {
    ...config.rootConfig,
    expo: modifiedExpoConfig
  };
  return finalizedConfig;
}
function isMatchingObject(expectedValues, actualValues) {
  for (const key in expectedValues) {
    if (!expectedValues.hasOwnProperty(key)) {
      continue;
    }
    if (typeof expectedValues[key] === 'object' && actualValues[key] !== null) {
      if (!isMatchingObject(expectedValues[key], actualValues[key])) {
        return false;
      }
    } else {
      if (expectedValues[key] !== actualValues[key]) {
        return false;
      }
    }
  }
  return true;
}
function ensureConfigHasDefaultValues({
  projectRoot,
  exp,
  pkg,
  paths,
  packageJsonPath,
  skipSDKVersionRequirement = false
}) {
  if (!exp) {
    exp = {};
  }
  exp = (0, _withInternal().withInternal)(exp, {
    projectRoot,
    ...(paths ?? {}),
    packageJsonPath
  });
  // Defaults for package.json fields
  const pkgName = typeof pkg.name === 'string' ? pkg.name : _path().default.basename(projectRoot);
  const pkgVersion = typeof pkg.version === 'string' ? pkg.version : '1.0.0';
  const pkgWithDefaults = {
    ...pkg,
    name: pkgName,
    version: pkgVersion
  };

  // Defaults for app.json/app.config.js fields
  const name = exp.name ?? pkgName;
  const slug = exp.slug ?? (0, _slugify().default)(name.toLowerCase());
  const version = exp.version ?? pkgVersion;
  let description = exp.description;
  if (!description && typeof pkg.description === 'string') {
    description = pkg.description;
  }
  const expWithDefaults = {
    ...exp,
    name,
    slug,
    version,
    description
  };
  let sdkVersion;
  try {
    sdkVersion = (0, _getExpoSDKVersion().getExpoSDKVersion)(projectRoot, expWithDefaults);
  } catch (error) {
    if (!skipSDKVersionRequirement) throw error;
  }
  let platforms = exp.platforms;
  if (!platforms) {
    platforms = getSupportedPlatforms(projectRoot);
  }
  return {
    exp: {
      ...expWithDefaults,
      sdkVersion,
      platforms
    },
    pkg: pkgWithDefaults
  };
}
const DEFAULT_BUILD_PATH = `web-build`;
function getWebOutputPath(config = {}) {
  if (process.env.WEBPACK_BUILD_OUTPUT_PATH) {
    return process.env.WEBPACK_BUILD_OUTPUT_PATH;
  }
  const expo = config.expo || config || {};
  return expo?.web?.build?.output || DEFAULT_BUILD_PATH;
}
function getNameFromConfig(exp = {}) {
  // For RN CLI support
  const appManifest = exp.expo || exp;
  const {
    web = {}
  } = appManifest;

  // rn-cli apps use a displayName value as well.
  const appName = exp.displayName || appManifest.displayName || appManifest.name;
  const webName = web.name || appName;
  return {
    appName,
    webName
  };
}
function getDefaultTarget(projectRoot, exp) {
  exp ??= getConfig(projectRoot, {
    skipSDKVersionRequirement: true
  }).exp;

  // before SDK 37, always default to managed to preserve previous behavior
  if (exp.sdkVersion && exp.sdkVersion !== 'UNVERSIONED' && _semver().default.lt(exp.sdkVersion, '37.0.0')) {
    return 'managed';
  }
  return isBareWorkflowProject(projectRoot) ? 'bare' : 'managed';
}
function isBareWorkflowProject(projectRoot) {
  const [pkg] = getPackageJsonAndPath(projectRoot);

  // TODO: Drop this
  if (pkg.dependencies && pkg.dependencies.expokit) {
    return false;
  }
  const xcodeprojFiles = (0, _glob().sync)('ios/**/*.xcodeproj', {
    absolute: true,
    cwd: projectRoot
  });
  if (xcodeprojFiles.length) {
    return true;
  }
  const gradleFiles = (0, _glob().sync)('android/**/*.gradle', {
    absolute: true,
    cwd: projectRoot
  });
  if (gradleFiles.length) {
    return true;
  }
  return false;
}

/**
 * Return a useful name describing the project config.
 * - dynamic: app.config.js
 * - static: app.json
 * - custom path app config relative to root folder
 * - both: app.config.js or app.json
 */
function getProjectConfigDescription(projectRoot) {
  const paths = getConfigFilePaths(projectRoot);
  return getProjectConfigDescriptionWithPaths(projectRoot, paths);
}

/**
 * Returns a string describing the configurations used for the given project root.
 * Will return null if no config is found.
 *
 * @param projectRoot
 * @param projectConfig
 */
function getProjectConfigDescriptionWithPaths(projectRoot, projectConfig) {
  if (projectConfig.dynamicConfigPath) {
    const relativeDynamicConfigPath = _path().default.relative(projectRoot, projectConfig.dynamicConfigPath);
    if (projectConfig.staticConfigPath) {
      return `${relativeDynamicConfigPath} or ${_path().default.relative(projectRoot, projectConfig.staticConfigPath)}`;
    }
    return relativeDynamicConfigPath;
  } else if (projectConfig.staticConfigPath) {
    return _path().default.relative(projectRoot, projectConfig.staticConfigPath);
  }
  // If a config doesn't exist, our tooling will generate a static app.json
  return 'app.json';
}
//# sourceMappingURL=Config.js.map