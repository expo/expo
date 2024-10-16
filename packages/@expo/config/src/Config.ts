import { ModConfig } from '@expo/config-plugins';
import JsonFile, { JSONObject } from '@expo/json-file';
import deepmerge from 'deepmerge';
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
  GetConfigOptions,
  PackageJSONConfig,
  Platform,
  ProjectConfig,
  ProjectTarget,
  WriteConfigOptions,
} from './Config.types';
import { getDynamicConfig, getStaticConfig } from './getConfig';
import { getExpoSDKVersion } from './getExpoSDKVersion';
import { withConfigPlugins } from './plugins/withConfigPlugins';
import { withInternal } from './plugins/withInternal';
import { getRootPackageJsonPath } from './resolvePackageJson';

type SplitConfigs = { expo: ExpoConfig; mods: ModConfig };

let hasWarnedAboutRootConfig = false;

/**
 * If a config has an `expo` object then that will be used as the config.
 * This method reduces out other top level values if an `expo` object exists.
 *
 * @param config Input config object to reduce
 */
function reduceExpoObject(config?: any): SplitConfigs {
  if (!config) return config === undefined ? null : config;

  if (config.expo && !hasWarnedAboutRootConfig) {
    const keys = Object.keys(config).filter((key) => key !== 'expo');
    if (keys.length) {
      hasWarnedAboutRootConfig = true;
      const ansiYellow = (str: string) => `\u001B[33m${str}\u001B[0m`;
      const ansiGray = (str: string) => `\u001B[90m${str}\u001B[0m`;
      const ansiBold = (str: string) => `\u001B[1m${str}\u001B[22m`;
      const plural = keys.length > 1;
      console.warn(
        ansiYellow(
          ansiBold('Warning: ') +
            `Root-level ${ansiBold(`"expo"`)} object found. Ignoring extra key${plural ? 's' : ''} in Expo config: ${keys
              .map((key) => `"${key}"`)
              .join(', ')}\n` +
            ansiGray(`Learn more: https://expo.fyi/root-expo-object`)
        )
      );
    }
  }

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
  if (resolveFrom.silent(projectRoot, 'react-dom') || resolveFrom.silent(projectRoot, 'react-native-web')) {
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

  function fillAndReturnConfig(
    config: SplitConfigs,
    dynamicConfigObjectType: string | null,
    mayHaveUnusedStaticConfig: boolean = false
  ) {
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
      hasUnusedStaticConfig:
        !!paths.staticConfigPath && !!paths.dynamicConfigPath && mayHaveUnusedStaticConfig,
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
    const {
      exportedObjectType,
      config: rawDynamicConfig,
      mayHaveUnusedStaticConfig,
    } = getDynamicConfig(paths.dynamicConfigPath, {
      projectRoot,
      staticConfigPath: paths.staticConfigPath,
      packageJsonPath,
      config: getContextConfig(staticConfig),
    });
    // Allow for the app.config.js to `export default null;`
    // Use `dynamicConfigPath` to detect if a dynamic config exists.
    const dynamicConfig = reduceExpoObject(rawDynamicConfig) || {};
    return fillAndReturnConfig(dynamicConfig, exportedObjectType, mayHaveUnusedStaticConfig);
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

/**
 * Get the static and dynamic config paths for a project. Also accounts for custom paths.
 *
 * @param projectRoot
 */
export function getConfigFilePaths(projectRoot: string): ConfigFilePaths {
  return {
    dynamicConfigPath: getDynamicConfigFilePath(projectRoot),
    staticConfigPath: getStaticConfigFilePath(projectRoot),
  };
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
  config: ExpoConfig | null;
}> {
  const config = getConfig(projectRoot, readOptions);
  const isDryRun = writeOptions.dryRun;

  // Create or modify the static config, when not using dynamic config
  if (!config.dynamicConfigPath) {
    const outputConfig = mergeConfigModifications(config, modifications);

    if (!isDryRun) {
      const configPath = config.staticConfigPath ?? path.join(projectRoot, 'app.json');
      await JsonFile.writeAsync(configPath, outputConfig, { json5: false });
    }

    return { type: 'success', config: outputConfig.expo ?? outputConfig };
  }

  // Attempt to write to a function-like dynamic config, when used with a static config
  if (config.staticConfigPath && config.dynamicConfigObjectType === 'function') {
    const outputConfig = mergeConfigModifications(config, modifications);

    if (isDryRun) {
      return {
        type: 'warn',
        message: `Cannot verify config modifications in dry-run mode for config at: ${path.relative(projectRoot, config.dynamicConfigPath)}`,
        config: null,
      };
    }

    // Attempt to write the static config with the config modifications
    await JsonFile.writeAsync(config.staticConfigPath, outputConfig, { json5: false });

    // Verify that the dynamic config is using the static config
    const newConfig = getConfig(projectRoot, readOptions);
    const newConfighasModifications = isMatchingObject(modifications, newConfig.exp);
    if (newConfighasModifications) {
      return {
        type: 'success',
        config: newConfig.exp,
      };
    }

    // Rollback the changes when the reloaded config did not include the modifications
    await JsonFile.writeAsync(config.staticConfigPath, config.rootConfig, { json5: false });
  }

  // We cannot automatically write to a dynamic config
  return {
    type: 'warn',
    message: `Cannot automatically write to dynamic config at: ${path.relative(
      projectRoot,
      config.dynamicConfigPath
    )}`,
    config: null,
  };
}

/** Merge the config modifications, using an optional possible top-level `expo` object. */
function mergeConfigModifications(
  config: ProjectConfig,
  modifications: Partial<ExpoConfig>
): AppJSONConfig {
  if (!config.rootConfig.expo) {
    return deepmerge(config.rootConfig, modifications);
  }

  return {
    ...config.rootConfig,
    expo: deepmerge(config.rootConfig.expo, modifications),
  };
}

function isMatchingObject<T extends Record<string, any>>(
  expectedValues: T,
  actualValues: T
): boolean {
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

const DEFAULT_BUILD_PATH = `web-build`;

export function getWebOutputPath(config: { [key: string]: any } = {}): string {
  if (process.env.WEBPACK_BUILD_OUTPUT_PATH) {
    return process.env.WEBPACK_BUILD_OUTPUT_PATH;
  }
  const expo = config.expo || config || {};
  return expo?.web?.build?.output || DEFAULT_BUILD_PATH;
}

export function getNameFromConfig(exp: Record<string, any> = {}): {
  appName?: string;
  webName?: string;
} {
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

  // TODO: Drop this
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
