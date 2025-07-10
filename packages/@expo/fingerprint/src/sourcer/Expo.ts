import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import type { ExpoConfig, ProjectConfig } from 'expo/config';
import path from 'path';
import semver from 'semver';

import { resolveExpoAutolinkingCliPath } from '../ExpoResolver';
import { SourceSkips } from './SourceSkips';
import { getFileBasedHashSourceAsync, relativizeJsonPaths, stringifyJsonSorted } from './Utils';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { toPosixPath } from '../utils/Path';

const debug = require('debug')('expo:fingerprint:sourcer:Expo');

export async function getExpoConfigSourcesAsync(
  projectRoot: string,
  config: ProjectConfig | null,
  loadedModules: string[] | null,
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (options.sourceSkips & SourceSkips.ExpoConfigAll) {
    return [];
  }
  if (config == null) {
    return [];
  }

  const results: HashSource[] = [];
  let expoConfig = normalizeExpoConfig(config.exp, projectRoot, options);

  // external files in config
  const isAndroid = options.platforms.includes('android');
  const isIos = options.platforms.includes('ios');
  const splashScreenPluginProps = getConfigPluginProps<{
    image?: string;
    dark?: {
      image?: string;
    };
    android?: NonNullable<ExpoConfig['android']>['splash'];
    ios?: NonNullable<ExpoConfig['ios']>['splash'];
  }>(expoConfig, 'expo-splash-screen');
  const externalFiles = [
    // icons
    expoConfig.icon,
    isAndroid ? expoConfig.android?.icon : undefined,
    isIos ? expoConfig.ios?.icon : undefined,
    isAndroid ? expoConfig.android?.adaptiveIcon?.foregroundImage : undefined,
    isAndroid ? expoConfig.android?.adaptiveIcon?.backgroundImage : undefined,
    expoConfig.notification?.icon,

    // expo-splash-screen images
    splashScreenPluginProps?.image,
    splashScreenPluginProps?.dark?.image,
    isAndroid ? splashScreenPluginProps?.android?.image : undefined,
    isAndroid ? splashScreenPluginProps?.android?.mdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.hdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.xhdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.xxhdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.xxxhdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.dark?.image : undefined,
    isAndroid ? splashScreenPluginProps?.android?.dark?.mdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.dark?.hdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.dark?.xhdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.dark?.xxhdpi : undefined,
    isAndroid ? splashScreenPluginProps?.android?.dark?.xxxhdpi : undefined,
    isIos ? splashScreenPluginProps?.ios?.image : undefined,
    isIos ? splashScreenPluginProps?.ios?.tabletImage : undefined,
    isIos ? splashScreenPluginProps?.ios?.dark?.image : undefined,
    isIos ? splashScreenPluginProps?.ios?.dark?.tabletImage : undefined,

    // legacy splash images
    expoConfig.splash?.image,
    isAndroid ? expoConfig.android?.splash?.image : undefined,
    isAndroid ? expoConfig.android?.splash?.mdpi : undefined,
    isAndroid ? expoConfig.android?.splash?.hdpi : undefined,
    isAndroid ? expoConfig.android?.splash?.xhdpi : undefined,
    isAndroid ? expoConfig.android?.splash?.xxhdpi : undefined,
    isAndroid ? expoConfig.android?.splash?.xxxhdpi : undefined,
    isIos ? expoConfig.ios?.splash?.image : undefined,
    isIos ? expoConfig.ios?.splash?.tabletImage : undefined,

    // google service files
    isAndroid ? expoConfig.android?.googleServicesFile : undefined,
    isIos ? expoConfig.ios?.googleServicesFile : undefined,
  ].filter(Boolean) as string[];
  const externalFileSources = (
    await Promise.all(
      externalFiles.map(async (file) => {
        const result = await getFileBasedHashSourceAsync(
          projectRoot,
          file,
          'expoConfigExternalFile'
        );
        if (result != null) {
          debug(`Adding config external file - ${chalk.dim(file)}`);
        }
        return result;
      })
    )
  ).filter(Boolean) as HashSource[];
  results.push(...externalFileSources);

  expoConfig = postUpdateExpoConfig(expoConfig, projectRoot);
  results.push({
    type: 'contents',
    id: 'expoConfig',
    contents: stringifyJsonSorted(expoConfig),
    reasons: ['expoConfig'],
  });

  // config plugins
  const configPluginModules: HashSource[] = (loadedModules ?? []).map((modulePath) => ({
    type: 'file',
    filePath: toPosixPath(modulePath),
    reasons: ['expoConfigPlugins'],
  }));
  results.push(...configPluginModules);

  return results;
}

function normalizeExpoConfig(
  config: ExpoConfig,
  projectRoot: string,
  options: NormalizedOptions
): ExpoConfig {
  // Deep clone by JSON.parse/stringify that assumes the config is serializable.
  const normalizedConfig: ExpoConfig = JSON.parse(JSON.stringify(config));

  const { sourceSkips } = options;
  delete normalizedConfig._internal;

  if (sourceSkips & SourceSkips.ExpoConfigVersions) {
    delete normalizedConfig.version;
    delete normalizedConfig.android?.versionCode;
    delete normalizedConfig.ios?.buildNumber;
  }

  if (sourceSkips & SourceSkips.ExpoConfigRuntimeVersionIfString) {
    if (typeof normalizedConfig.runtimeVersion === 'string') {
      delete normalizedConfig.runtimeVersion;
    }
    if (typeof normalizedConfig.android?.runtimeVersion === 'string') {
      delete normalizedConfig.android.runtimeVersion;
    }
    if (typeof normalizedConfig.ios?.runtimeVersion === 'string') {
      delete normalizedConfig.ios.runtimeVersion;
    }
    if (typeof normalizedConfig.web?.runtimeVersion === 'string') {
      delete normalizedConfig.web.runtimeVersion;
    }
  }

  if (sourceSkips & SourceSkips.ExpoConfigNames) {
    normalizedConfig.name = '';
    delete normalizedConfig.description;
    delete normalizedConfig.web?.name;
    delete normalizedConfig.web?.shortName;
    delete normalizedConfig.web?.description;
  }

  if (sourceSkips & SourceSkips.ExpoConfigAndroidPackage) {
    delete normalizedConfig.android?.package;
  }

  if (sourceSkips & SourceSkips.ExpoConfigIosBundleIdentifier) {
    delete normalizedConfig.ios?.bundleIdentifier;
  }

  if (sourceSkips & SourceSkips.ExpoConfigSchemes) {
    delete normalizedConfig.scheme;
    normalizedConfig.slug = '';
  }

  if (sourceSkips & SourceSkips.ExpoConfigEASProject) {
    delete normalizedConfig.owner;
    delete normalizedConfig?.extra?.eas;
    delete normalizedConfig?.updates?.url;
  }

  if (sourceSkips & SourceSkips.ExpoConfigAssets) {
    delete normalizedConfig.icon;
    delete normalizedConfig.splash;
    delete normalizedConfig.android?.adaptiveIcon;
    delete normalizedConfig.android?.icon;
    delete normalizedConfig.android?.splash;
    delete normalizedConfig.ios?.icon;
    delete normalizedConfig.ios?.splash;
    delete normalizedConfig.web?.favicon;
    delete normalizedConfig.web?.splash;
  }

  if (sourceSkips & SourceSkips.ExpoConfigExtraSection) {
    delete normalizedConfig.extra;
  }

  return relativizeJsonPaths(normalizedConfig, projectRoot);
}

/**
 * Gives the last chance to modify the ExpoConfig.
 * For example, we can remove some fields that are already included in the fingerprint.
 */
function postUpdateExpoConfig(config: ExpoConfig, projectRoot: string): ExpoConfig {
  // The config is already a clone, so we can modify it in place for performance.

  // googleServicesFile may contain absolute paths on EAS with file-based secrets.
  // Given we include googleServicesFile as external files already, we can remove it from the config.
  delete config.android?.googleServicesFile;
  delete config.ios?.googleServicesFile;

  return config;
}

export async function getEasBuildSourcesAsync(projectRoot: string, options: NormalizedOptions) {
  const files = ['eas.json', '.easignore'];
  const results = (
    await Promise.all(
      files.map(async (file) => {
        const result = await getFileBasedHashSourceAsync(projectRoot, file, 'easBuild');
        if (result != null) {
          debug(`Adding eas file - ${chalk.dim(file)}`);
        }
        return result;
      })
    )
  ).filter(Boolean) as HashSource[];
  return results;
}

export async function getExpoAutolinkingAndroidSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions,
  expoAutolinkingVersion: string
): Promise<HashSource[]> {
  if (!options.platforms.includes('android')) {
    return [];
  }

  try {
    const reasons = ['expoAutolinkingAndroid'];
    const results: HashSource[] = [];
    const { stdout } = await spawnAsync(
      'node',
      [resolveExpoAutolinkingCliPath(projectRoot), 'resolve', '-p', 'android', '--json'],
      { cwd: projectRoot }
    );
    const config = sortExpoAutolinkingAndroidConfig(JSON.parse(stdout));
    for (const module of config.modules) {
      for (const project of module.projects) {
        const filePath = toPosixPath(path.relative(projectRoot, project.sourceDir));
        project.sourceDir = filePath; // use relative path for the dir
        debug(`Adding expo-modules-autolinking android dir - ${chalk.dim(filePath)}`);
        results.push({ type: 'dir', filePath, reasons });
      }
      if (module.plugins) {
        for (const plugin of module.plugins) {
          const filePath = toPosixPath(path.relative(projectRoot, plugin.sourceDir));
          plugin.sourceDir = filePath; // use relative path for the dir
          debug(`Adding expo-modules-autolinking android dir - ${chalk.dim(filePath)}`);
          results.push({ type: 'dir', filePath, reasons });
        }
      }
      if (module.aarProjects) {
        for (const aarProject of module.aarProjects) {
          // use relative path for aarProject fields
          aarProject.aarFilePath = toPosixPath(path.relative(projectRoot, aarProject.aarFilePath));
          aarProject.projectDir = toPosixPath(path.relative(projectRoot, aarProject.projectDir));
        }
      }
    }
    results.push({
      type: 'contents',
      id: 'expoAutolinkingConfig:android',
      contents: JSON.stringify(config),
      reasons,
    });
    return results;
  } catch {
    return [];
  }
}

/**
 * Gets the patch sources for the `patch-project`.
 */
export async function getExpoCNGPatchSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  const result = await getFileBasedHashSourceAsync(projectRoot, 'cng-patches', 'expoCNGPatches');
  if (result != null) {
    debug(`Adding dir - ${chalk.dim('cng-patches')}`);
    return [result];
  }
  return [];
}

export async function getExpoAutolinkingIosSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions,
  expoAutolinkingVersion: string
): Promise<HashSource[]> {
  if (!options.platforms.includes('ios')) {
    return [];
  }

  // expo-modules-autolinking 1.10.0 added support for apple platform
  const platform = semver.lt(expoAutolinkingVersion, '1.10.0') ? 'ios' : 'apple';
  try {
    const reasons = ['expoAutolinkingIos'];
    const results: HashSource[] = [];
    const { stdout } = await spawnAsync(
      'node',
      [resolveExpoAutolinkingCliPath(projectRoot), 'resolve', '-p', platform, '--json'],
      { cwd: projectRoot }
    );
    const config = JSON.parse(stdout);
    for (const module of config.modules) {
      for (const pod of module.pods) {
        const filePath = toPosixPath(path.relative(projectRoot, pod.podspecDir));
        pod.podspecDir = filePath; // use relative path for the dir
        debug(`Adding expo-modules-autolinking ios dir - ${chalk.dim(filePath)}`);
        results.push({ type: 'dir', filePath, reasons });
      }
    }
    results.push({
      type: 'contents',
      id: 'expoAutolinkingConfig:ios',
      contents: JSON.stringify(config),
      reasons,
    });
    return results;
  } catch {
    return [];
  }
}

/**
 * Sort the expo-modules-autolinking android config to make it stable from hashing.
 */
export function sortExpoAutolinkingAndroidConfig(config: Record<string, any>): Record<string, any> {
  for (const module of config.modules) {
    // Sort the projects by project.name
    module.projects.sort((a: Record<string, any>, b: Record<string, any>) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
  }
  return config;
}

/**
 * Get the props for a config-plugin
 */
export function getConfigPluginProps<Props>(config: ExpoConfig, pluginName: string): Props | null {
  const plugin = (config.plugins ?? []).find((plugin) => {
    if (Array.isArray(plugin)) {
      return plugin[0] === pluginName;
    }
    return plugin === pluginName;
  });
  if (Array.isArray(plugin)) {
    return (plugin[1] ?? null) as Props;
  }
  return null;
}
