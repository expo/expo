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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * If a config has an `expo` object then that will be used as the config.
 * This method reduces out other top level values if an `expo` object exists.
 *
 * @param config Input config object to reduce
 */
function reduceExpoObject(config) {
  var _config$expo;
  if (!config) return config === undefined ? null : config;
  const {
    mods,
    ...expo
  } = (_config$expo = config.expo) !== null && _config$expo !== void 0 ? _config$expo : config;
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
  if (_resolveFrom().default.silent(projectRoot, 'react-native-web')) {
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
  function fillAndReturnConfig(config, dynamicConfigObjectType) {
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
      staticConfigPath: paths.staticConfigPath
    };
    if (options.isModdedConfig) {
      var _config$mods;
      // @ts-ignore: Add the mods back to the object.
      configWithDefaultValues.exp.mods = (_config$mods = config.mods) !== null && _config$mods !== void 0 ? _config$mods : null;
    }

    // Apply static json plugins, should be done after _internal
    configWithDefaultValues.exp = (0, _withConfigPlugins().withConfigPlugins)(configWithDefaultValues.exp, !!options.skipPlugins);
    if (!options.isModdedConfig) {
      // @ts-ignore: Delete mods added by static plugins when they won't have a chance to be evaluated
      delete configWithDefaultValues.exp.mods;
    }
    if (options.isPublicConfig) {
      var _configWithDefaultVal, _configWithDefaultVal2, _configWithDefaultVal3, _configWithDefaultVal4;
      // TODD(EvanBacon): Drop plugins array after it's been resolved.

      // Remove internal values with references to user's file paths from the public config.
      delete configWithDefaultValues.exp._internal;
      if (configWithDefaultValues.exp.hooks) {
        delete configWithDefaultValues.exp.hooks;
      }
      if ((_configWithDefaultVal = configWithDefaultValues.exp.ios) !== null && _configWithDefaultVal !== void 0 && _configWithDefaultVal.config) {
        delete configWithDefaultValues.exp.ios.config;
      }
      if ((_configWithDefaultVal2 = configWithDefaultValues.exp.android) !== null && _configWithDefaultVal2 !== void 0 && _configWithDefaultVal2.config) {
        delete configWithDefaultValues.exp.android.config;
      }
      (_configWithDefaultVal3 = configWithDefaultValues.exp.updates) === null || _configWithDefaultVal3 === void 0 ? true : delete _configWithDefaultVal3.codeSigningCertificate;
      (_configWithDefaultVal4 = configWithDefaultValues.exp.updates) === null || _configWithDefaultVal4 === void 0 ? true : delete _configWithDefaultVal4.codeSigningMetadata;
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
      config: rawDynamicConfig
    } = (0, _getConfig().getDynamicConfig)(paths.dynamicConfigPath, {
      projectRoot,
      staticConfigPath: paths.staticConfigPath,
      packageJsonPath,
      config: getContextConfig(staticConfig)
    });
    // Allow for the app.config.js to `export default null;`
    // Use `dynamicConfigPath` to detect if a dynamic config exists.
    const dynamicConfig = reduceExpoObject(rawDynamicConfig) || {};
    return fillAndReturnConfig(dynamicConfig, exportedObjectType);
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
  if (config.dynamicConfigPath) {
    // We cannot automatically write to a dynamic config.
    /* Currently we should just use the safest approach possible, informing the user that they'll need to manually modify their dynamic config.
     if (config.staticConfigPath) {
      // Both a dynamic and a static config exist.
      if (config.dynamicConfigObjectType === 'function') {
        // The dynamic config exports a function, this means it possibly extends the static config.
      } else {
        // Dynamic config ignores the static config, there isn't a reason to automatically write to it.
        // Instead we should warn the user to add values to their dynamic config.
      }
    }
    */
    return {
      type: 'warn',
      message: `Cannot automatically write to dynamic config at: ${_path().default.relative(projectRoot, config.dynamicConfigPath)}`,
      config: null
    };
  } else if (config.staticConfigPath) {
    // Static with no dynamic config, this means we can append to the config automatically.
    let outputConfig;
    // If the config has an expo object (app.json) then append the options to that object.
    if (config.rootConfig.expo) {
      outputConfig = {
        ...config.rootConfig,
        expo: {
          ...config.rootConfig.expo,
          ...modifications
        }
      };
    } else {
      // Otherwise (app.config.json) just add the config modification to the top most level.
      outputConfig = {
        ...config.rootConfig,
        ...modifications
      };
    }
    if (!writeOptions.dryRun) {
      await _jsonFile().default.writeAsync(config.staticConfigPath, outputConfig, {
        json5: false
      });
    }
    return {
      type: 'success',
      config: outputConfig
    };
  }
  return {
    type: 'fail',
    message: 'No config exists',
    config: null
  };
}
function ensureConfigHasDefaultValues({
  projectRoot,
  exp,
  pkg,
  paths,
  packageJsonPath,
  skipSDKVersionRequirement = false
}) {
  var _exp$name, _exp$slug, _exp$version;
  if (!exp) {
    exp = {};
  }
  exp = (0, _withInternal().withInternal)(exp, {
    projectRoot,
    ...(paths !== null && paths !== void 0 ? paths : {}),
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
  const name = (_exp$name = exp.name) !== null && _exp$name !== void 0 ? _exp$name : pkgName;
  const slug = (_exp$slug = exp.slug) !== null && _exp$slug !== void 0 ? _exp$slug : (0, _slugify().default)(name.toLowerCase());
  const version = (_exp$version = exp.version) !== null && _exp$version !== void 0 ? _exp$version : pkgVersion;
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
  var _expo$web, _expo$web$build;
  if (process.env.WEBPACK_BUILD_OUTPUT_PATH) {
    return process.env.WEBPACK_BUILD_OUTPUT_PATH;
  }
  const expo = config.expo || config || {};
  return (expo === null || expo === void 0 ? void 0 : (_expo$web = expo.web) === null || _expo$web === void 0 ? void 0 : (_expo$web$build = _expo$web.build) === null || _expo$web$build === void 0 ? void 0 : _expo$web$build.output) || DEFAULT_BUILD_PATH;
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
  var _exp;
  (_exp = exp) !== null && _exp !== void 0 ? _exp : exp = getConfig(projectRoot, {
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