import { ModConfig } from '@expo/config-plugins';
import JsonFile, { JSONObject } from '@expo/json-file';
import fs from 'fs';
import { sync as globSync } from 'glob';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';
import slugify from 'slugify';

import {
  AppJSONConfig,
  ConfigFilePaths,
  ExpoConfig,
  ExpRc,
  GetConfigOptions,
  PackageJSONConfig,
  Platform,
  ProjectConfig,
  ProjectTarget,
  WriteConfigOptions,
} from './Config.types';
import { ConfigError } from './Errors';
import { getExpoSDKVersion } from './Project';
import { getDynamicConfig, getStaticConfig } from './getConfig';
import { getFullName } from './getFullName';
import { withConfigPlugins } from './plugins/withConfigPlugins';
import { withInternal } from './plugins/withInternal';
import { getRootPackageJsonPath } from './resolvePackageJson';

type SplitConfigs = { expo: ExpoConfig; mods: ModConfig };

/**
 * If a config has an `expo` object then that will be used as the config.
 * This method reduces out other top level values if an `expo` object exists.
 *
 * @param config Input config object to reduce
 */
function reduceExpoObject(config?: any): SplitConfigs {
  if (!config) return config === undefined ? null : config;

  const { mods, ...expo } = config.expo ?? config;

  return {
    expo,
    mods,
  };
}

/**
 * Get all platforms that a project is currently capable of running.
 *
 * @param projectRoot
 * @param exp
 */
function getSupportedPlatforms(projectRoot: string): Platform[] {
  const platforms: Platform[] = [];
  if (resolveFrom.silent(projectRoot, 'react-native')) {
    platforms.push('ios', 'android');
  }
  if (resolveFrom.silent(projectRoot, 'react-native-web')) {
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
export function getConfig(projectRoot: string, options: GetConfigOptions = {}): ProjectConfig {
  const paths = getConfigFilePaths(projectRoot);

  const rawStaticConfig = paths.staticConfigPath ? getStaticConfig(paths.staticConfigPath) : null;
  // For legacy reasons, always return an object.
  const rootConfig = (rawStaticConfig || {}) as AppJSONConfig;
  const staticConfig = reduceExpoObject(rawStaticConfig) || {};

  // Can only change the package.json location if an app.json or app.config.json exists
  const [packageJson, packageJsonPath] = getPackageJsonAndPath(projectRoot);

  function fillAndReturnConfig(config: SplitConfigs, dynamicConfigObjectType: string | null) {
    const configWithDefaultValues = {
      ...ensureConfigHasDefaultValues({
        projectRoot,
        exp: config.expo,
        pkg: packageJson,
        skipSDKVersionRequirement: options.skipSDKVersionRequirement,
        paths,
        packageJsonPath,
      }),
      mods: config.mods,
      dynamicConfigObjectType,
      rootConfig,
      dynamicConfigPath: paths.dynamicConfigPath,
      staticConfigPath: paths.staticConfigPath,
    };

    if (options.isModdedConfig) {
      // @ts-ignore: Add the mods back to the object.
      configWithDefaultValues.exp.mods = config.mods ?? null;
    }

    // Apply static json plugins, should be done after _internal
    configWithDefaultValues.exp = withConfigPlugins(
      configWithDefaultValues.exp,
      !!options.skipPlugins
    );

    if (!options.isModdedConfig) {
      // @ts-ignore: Delete mods added by static plugins when they won't have a chance to be evaluated
      delete configWithDefaultValues.exp.mods;
    }

    if (options.isPublicConfig) {
      // Remove internal values with references to user's file paths from the public config.
      delete configWithDefaultValues.exp._internal;

      if (configWithDefaultValues.exp.hooks) {
        delete configWithDefaultValues.exp.hooks;
      }
      if (configWithDefaultValues.exp.ios?.config) {
        delete configWithDefaultValues.exp.ios.config;
      }
      if (configWithDefaultValues.exp.android?.config) {
        delete configWithDefaultValues.exp.android.config;
      }

      // These value will be overwritten when the manifest is being served from the host (i.e. not completely accurate).
      // @ts-ignore: currentFullName not on type yet.
      configWithDefaultValues.exp.currentFullName = getFullName(configWithDefaultValues.exp);
      // @ts-ignore: originalFullName not on type yet.
      configWithDefaultValues.exp.originalFullName = getFullName(configWithDefaultValues.exp);

      delete configWithDefaultValues.exp.updates?.codeSigningCertificate;
      delete configWithDefaultValues.exp.updates?.codeSigningMetadata;
    }

    return configWithDefaultValues;
  }

  // Fill in the static config
  function getContextConfig(config: SplitConfigs) {
    return ensureConfigHasDefaultValues({
      projectRoot,
      exp: config.expo,
      pkg: packageJson,
      skipSDKVersionRequirement: true,
      paths,
      packageJsonPath,
    }).exp;
  }

  if (paths.dynamicConfigPath) {
    // No app.config.json or app.json but app.config.js
    const { exportedObjectType, config: rawDynamicConfig } = getDynamicConfig(
      paths.dynamicConfigPath,
      {
        projectRoot,
        staticConfigPath: paths.staticConfigPath,
        packageJsonPath,
        config: getContextConfig(staticConfig),
      }
    );
    // Allow for the app.config.js to `export default null;`
    // Use `dynamicConfigPath` to detect if a dynamic config exists.
    const dynamicConfig = reduceExpoObject(rawDynamicConfig) || {};
    return fillAndReturnConfig(dynamicConfig, exportedObjectType);
  }

  // No app.config.js but json or no config
  return fillAndReturnConfig(staticConfig || {}, null);
}

export function getPackageJson(projectRoot: string): PackageJSONConfig {
  const [pkg] = getPackageJsonAndPath(projectRoot);
  return pkg;
}

function getPackageJsonAndPath(projectRoot: string): [PackageJSONConfig, string] {
  const packageJsonPath = getRootPackageJsonPath(projectRoot);
  return [JsonFile.read(packageJsonPath), packageJsonPath];
}

export function readConfigJson(
  projectRoot: string,
  skipValidation: boolean = false,
  skipSDKVersionRequirement: boolean = false
): ProjectConfig {
  const paths = getConfigFilePaths(projectRoot);

  const rawStaticConfig = paths.staticConfigPath ? getStaticConfig(paths.staticConfigPath) : null;

  const getConfigName = (): string => {
    if (paths.staticConfigPath) return ` \`${path.basename(paths.staticConfigPath)}\``;
    return '';
  };

  let outputRootConfig = rawStaticConfig as JSONObject | null;
  if (outputRootConfig === null || typeof outputRootConfig !== 'object') {
    if (skipValidation) {
      outputRootConfig = { expo: {} };
    } else {
      throw new ConfigError(
        `Project at path ${path.resolve(
          projectRoot
        )} does not contain a valid Expo config${getConfigName()}`,
        'NOT_OBJECT'
      );
    }
  }
  let exp = outputRootConfig.expo as Partial<ExpoConfig>;
  if (exp === null || typeof exp !== 'object') {
    throw new ConfigError(
      `Property 'expo' in${getConfigName()} for project at path ${path.resolve(
        projectRoot
      )} is not an object. Please make sure${getConfigName()} includes a managed Expo app config like this: ${APP_JSON_EXAMPLE}`,
      'NO_EXPO'
    );
  }

  exp = { ...exp };

  const [pkg, packageJsonPath] = getPackageJsonAndPath(projectRoot);

  return {
    ...ensureConfigHasDefaultValues({
      projectRoot,
      exp,
      pkg,
      skipSDKVersionRequirement,
      paths,
      packageJsonPath,
    }),
    mods: null,
    dynamicConfigObjectType: null,
    rootConfig: { ...outputRootConfig } as AppJSONConfig,
    ...paths,
  };
}

/**
 * Get the static and dynamic config paths for a project. Also accounts for custom paths.
 *
 * @param projectRoot
 */
export function getConfigFilePaths(projectRoot: string): ConfigFilePaths {
  const customPaths = getCustomConfigFilePaths(projectRoot);
  if (customPaths) {
    return customPaths;
  }

  return {
    dynamicConfigPath: getDynamicConfigFilePath(projectRoot),
    staticConfigPath: getStaticConfigFilePath(projectRoot),
  };
}

function getCustomConfigFilePaths(projectRoot: string): ConfigFilePaths | null {
  if (!customConfigPaths[projectRoot]) {
    return null;
  }
  // If the user picks a custom config path, we will only use that and skip searching for a secondary config.
  if (isDynamicFilePath(customConfigPaths[projectRoot])) {
    return {
      dynamicConfigPath: customConfigPaths[projectRoot],
      staticConfigPath: null,
    };
  }
  // Anything that's not js or ts will be treated as json.
  return { staticConfigPath: customConfigPaths[projectRoot], dynamicConfigPath: null };
}

function getDynamicConfigFilePath(projectRoot: string): string | null {
  for (const fileName of ['app.config.ts', 'app.config.js']) {
    const configPath = path.join(projectRoot, fileName);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

function getStaticConfigFilePath(projectRoot: string): string | null {
  for (const fileName of ['app.config.json', 'app.json']) {
    const configPath = path.join(projectRoot, fileName);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

// TODO: This should account for dynamic configs
export function findConfigFile(
  projectRoot: string
): { configPath: string; configName: string; configNamespace: 'expo' } {
  let configPath: string;
  // Check for a custom config path first.
  if (customConfigPaths[projectRoot]) {
    configPath = customConfigPaths[projectRoot];
    // We shouldn't verify if the file exists because
    // the user manually specified that this path should be used.
    return {
      configPath,
      configName: path.basename(configPath),
      configNamespace: 'expo',
    };
  } else {
    // app.config.json takes higher priority over app.json
    configPath = path.join(projectRoot, 'app.config.json');
    if (!fs.existsSync(configPath)) {
      configPath = path.join(projectRoot, 'app.json');
    }
  }

  return {
    configPath,
    configName: path.basename(configPath),
    configNamespace: 'expo',
  };
}

// TODO: deprecate
export function configFilename(projectRoot: string): string {
  return findConfigFile(projectRoot).configName;
}

export async function readExpRcAsync(projectRoot: string): Promise<ExpRc> {
  const expRcPath = path.join(projectRoot, '.exprc');
  return await JsonFile.readAsync(expRcPath, { json5: true, cantReadFileDefault: {} });
}

const customConfigPaths: { [projectRoot: string]: string } = {};

export function resetCustomConfigPaths(): void {
  for (const key of Object.keys(customConfigPaths)) {
    delete customConfigPaths[key];
  }
}

export function setCustomConfigPath(projectRoot: string, configPath: string): void {
  customConfigPaths[projectRoot] = configPath;
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
export async function modifyConfigAsync(
  projectRoot: string,
  modifications: Partial<ExpoConfig>,
  readOptions: GetConfigOptions = {},
  writeOptions: WriteConfigOptions = {}
): Promise<{
  type: 'success' | 'warn' | 'fail';
  message?: string;
  config: AppJSONConfig | null;
}> {
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
      message: `Cannot automatically write to dynamic config at: ${path.relative(
        projectRoot,
        config.dynamicConfigPath
      )}`,
      config: null,
    };
  } else if (config.staticConfigPath) {
    // Static with no dynamic config, this means we can append to the config automatically.
    let outputConfig: AppJSONConfig;
    // If the config has an expo object (app.json) then append the options to that object.
    if (config.rootConfig.expo) {
      outputConfig = {
        ...config.rootConfig,
        expo: { ...config.rootConfig.expo, ...modifications },
      };
    } else {
      // Otherwise (app.config.json) just add the config modification to the top most level.
      outputConfig = { ...config.rootConfig, ...modifications };
    }
    if (!writeOptions.dryRun) {
      await JsonFile.writeAsync(config.staticConfigPath, outputConfig, { json5: false });
    }
    return { type: 'success', config: outputConfig };
  }

  return { type: 'fail', message: 'No config exists', config: null };
}

const APP_JSON_EXAMPLE = JSON.stringify({
  expo: {
    name: 'My app',
    slug: 'my-app',
    sdkVersion: '...',
  },
});

function ensureConfigHasDefaultValues({
  projectRoot,
  exp,
  pkg,
  paths,
  packageJsonPath,
  skipSDKVersionRequirement = false,
}: {
  projectRoot: string;
  exp: Partial<ExpoConfig> | null;
  pkg: JSONObject;
  skipSDKVersionRequirement?: boolean;
  paths?: ConfigFilePaths;
  packageJsonPath?: string;
}): { exp: ExpoConfig; pkg: PackageJSONConfig } {
  if (!exp) {
    exp = {};
  }
  exp = withInternal(exp as any, {
    projectRoot,
    ...(paths ?? {}),
    packageJsonPath,
  });
  // Defaults for package.json fields
  const pkgName = typeof pkg.name === 'string' ? pkg.name : path.basename(projectRoot);
  const pkgVersion = typeof pkg.version === 'string' ? pkg.version : '1.0.0';

  const pkgWithDefaults = { ...pkg, name: pkgName, version: pkgVersion };

  // Defaults for app.json/app.config.js fields
  const name = exp.name ?? pkgName;
  const slug = exp.slug ?? slugify(name.toLowerCase());
  const version = exp.version ?? pkgVersion;
  let description = exp.description;
  if (!description && typeof pkg.description === 'string') {
    description = pkg.description;
  }

  const expWithDefaults = { ...exp, name, slug, version, description };

  let sdkVersion;
  try {
    sdkVersion = getExpoSDKVersion(projectRoot, expWithDefaults);
  } catch (error) {
    if (!skipSDKVersionRequirement) throw error;
  }

  let platforms = exp.platforms;
  if (!platforms) {
    platforms = getSupportedPlatforms(projectRoot);
  }

  return {
    exp: { ...expWithDefaults, sdkVersion, platforms },
    pkg: pkgWithDefaults,
  };
}

export async function writeConfigJsonAsync(
  projectRoot: string,
  options: object
): Promise<ProjectConfig> {
  const paths = getConfigFilePaths(projectRoot);
  let { exp, pkg, rootConfig, dynamicConfigObjectType } = readConfigJson(projectRoot);
  exp = { ...rootConfig.expo, ...options };
  rootConfig = { ...rootConfig, expo: exp };

  if (paths.staticConfigPath) {
    await JsonFile.writeAsync(paths.staticConfigPath, rootConfig, { json5: false });
  } else {
    console.log('Failed to write to config: ', options);
  }

  return {
    exp,
    pkg,
    rootConfig,
    dynamicConfigObjectType,
    ...paths,
  };
}
const DEFAULT_BUILD_PATH = `web-build`;

export function getWebOutputPath(config: { [key: string]: any } = {}): string {
  if (process.env.WEBPACK_BUILD_OUTPUT_PATH) {
    return process.env.WEBPACK_BUILD_OUTPUT_PATH;
  }
  const expo = config.expo || config || {};
  return expo?.web?.build?.output || DEFAULT_BUILD_PATH;
}

export function getNameFromConfig(
  exp: Record<string, any> = {}
): { appName?: string; webName?: string } {
  // For RN CLI support
  const appManifest = exp.expo || exp;
  const { web = {} } = appManifest;

  // rn-cli apps use a displayName value as well.
  const appName = exp.displayName || appManifest.displayName || appManifest.name;
  const webName = web.name || appName;

  return {
    appName,
    webName,
  };
}

export function getDefaultTarget(
  projectRoot: string,
  exp?: Pick<ExpoConfig, 'sdkVersion'>
): ProjectTarget {
  exp ??= getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp;

  // before SDK 37, always default to managed to preserve previous behavior
  if (exp.sdkVersion && exp.sdkVersion !== 'UNVERSIONED' && semver.lt(exp.sdkVersion, '37.0.0')) {
    return 'managed';
  }
  return isBareWorkflowProject(projectRoot) ? 'bare' : 'managed';
}

function isBareWorkflowProject(projectRoot: string): boolean {
  const [pkg] = getPackageJsonAndPath(projectRoot);

  if (pkg.dependencies && pkg.dependencies.expokit) {
    return false;
  }

  const xcodeprojFiles = globSync('ios/**/*.xcodeproj', {
    absolute: true,
    cwd: projectRoot,
  });
  if (xcodeprojFiles.length) {
    return true;
  }
  const gradleFiles = globSync('android/**/*.gradle', {
    absolute: true,
    cwd: projectRoot,
  });
  if (gradleFiles.length) {
    return true;
  }

  return false;
}

/**
 * true if the file is .js or .ts
 *
 * @param filePath
 */
function isDynamicFilePath(filePath: string): boolean {
  return !!filePath.match(/\.[j|t]s$/);
}

/**
 * Return a useful name describing the project config.
 * - dynamic: app.config.js
 * - static: app.json
 * - custom path app config relative to root folder
 * - both: app.config.js or app.json
 */
export function getProjectConfigDescription(projectRoot: string): string {
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
export function getProjectConfigDescriptionWithPaths(
  projectRoot: string,
  projectConfig: ConfigFilePaths
): string {
  if (projectConfig.dynamicConfigPath) {
    const relativeDynamicConfigPath = path.relative(projectRoot, projectConfig.dynamicConfigPath);
    if (projectConfig.staticConfigPath) {
      return `${relativeDynamicConfigPath} or ${path.relative(
        projectRoot,
        projectConfig.staticConfigPath
      )}`;
    }
    return relativeDynamicConfigPath;
  } else if (projectConfig.staticConfigPath) {
    return path.relative(projectRoot, projectConfig.staticConfigPath);
  }
  // If a config doesn't exist, our tooling will generate a static app.json
  return 'app.json';
}

export * from './Config.types';

export { isLegacyImportsEnabled } from './isLegacyImportsEnabled';
