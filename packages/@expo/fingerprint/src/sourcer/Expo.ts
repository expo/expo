import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import type { ExpoConfig, ProjectConfig } from 'expo/config';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import { getExpoConfigLoaderPath } from './ExpoConfigLoader';
import { SourceSkips } from './SourceSkips';
import { getFileBasedHashSourceAsync, stringifyJsonSorted } from './Utils';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';

const debug = require('debug')('expo:fingerprint:sourcer:Expo');

export async function getExpoConfigSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (!resolveFrom.silent(path.resolve(projectRoot), 'expo/config')) {
    return [];
  }

  const results: HashSource[] = [];
  let config: ProjectConfig;
  let expoConfig: ExpoConfig;
  let loadedModules: string[] = [];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-fingerprint-'));
  const ignoredFile = await createTempIgnoredFileAsync(tmpDir, options);
  try {
    const { stdout } = await spawnAsync(
      'node',
      [getExpoConfigLoaderPath(), path.resolve(projectRoot), ignoredFile],
      { cwd: projectRoot }
    );
    const stdoutJson = JSON.parse(stdout);
    config = stdoutJson.config;
    expoConfig = normalizeExpoConfig(config.exp, options);
    loadedModules = stdoutJson.loadedModules;
    results.push({
      type: 'contents',
      id: 'expoConfig',
      contents: stringifyJsonSorted(expoConfig),
      reasons: ['expoConfig'],
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.warn(`Cannot get Expo config from an Expo project - ${e.message}: `, e.stack);
    }
    return [];
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch {}
  }

  // external files in config
  const isAndroid = options.platforms.includes('android');
  const isIos = options.platforms.includes('ios');
  const externalFiles = [
    // icons
    expoConfig.icon,
    isAndroid ? expoConfig.android?.icon : undefined,
    isIos ? expoConfig.ios?.icon : undefined,
    isAndroid ? expoConfig.android?.adaptiveIcon?.foregroundImage : undefined,
    isAndroid ? expoConfig.android?.adaptiveIcon?.backgroundImage : undefined,
    expoConfig.notification?.icon,

    // splash images
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

  // config plugins
  const configPluginModules: HashSource[] = loadedModules.map((modulePath) => ({
    type: 'file',
    filePath: modulePath,
    reasons: ['expoConfigPlugins'],
  }));
  results.push(...configPluginModules);

  return results;
}

function normalizeExpoConfig(config: ExpoConfig, options: NormalizedOptions): ExpoConfig {
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

  return normalizedConfig;
}

/**
 * Create a temporary file with ignored paths from options that will be read by the ExpoConfigLoader.
 */
async function createTempIgnoredFileAsync(
  tmpDir: string,
  options: NormalizedOptions
): Promise<string> {
  const ignoredFile = path.join(tmpDir, '.fingerprintignore');
  const ignorePaths = options.ignorePathMatchObjects.map((match) => match.pattern);
  await fs.writeFile(ignoredFile, ignorePaths.join('\n'));
  return ignoredFile;
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
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (!options.platforms.includes('android')) {
    return [];
  }

  try {
    const reasons = ['expoAutolinkingAndroid'];
    const results: HashSource[] = [];
    const { stdout } = await spawnAsync(
      'npx',
      ['expo-modules-autolinking', 'resolve', '-p', 'android', '--json'],
      { cwd: projectRoot }
    );
    const config = sortExpoAutolinkingAndroidConfig(JSON.parse(stdout));
    for (const module of config.modules) {
      for (const project of module.projects) {
        const filePath = path.relative(projectRoot, project.sourceDir);
        project.sourceDir = filePath; // use relative path for the dir
        debug(`Adding expo-modules-autolinking android dir - ${chalk.dim(filePath)}`);
        results.push({ type: 'dir', filePath, reasons });
      }
      if (module.plugins) {
        for (const plugin of module.plugins) {
          const filePath = path.relative(projectRoot, plugin.sourceDir);
          plugin.sourceDir = filePath; // use relative path for the dir
          debug(`Adding expo-modules-autolinking android dir - ${chalk.dim(filePath)}`);
          results.push({ type: 'dir', filePath, reasons });
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
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (!options.platforms.includes('ios')) {
    return [];
  }

  const platform = getIosAutolinkingPlatformParam(projectRoot);
  try {
    const reasons = ['expoAutolinkingIos'];
    const results: HashSource[] = [];
    const { stdout } = await spawnAsync(
      'npx',
      ['expo-modules-autolinking', 'resolve', '-p', platform, '--json'],
      { cwd: projectRoot }
    );
    const config = JSON.parse(stdout);
    for (const module of config.modules) {
      for (const pod of module.pods) {
        const filePath = path.relative(projectRoot, pod.podspecDir);
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
 * Get the platform parameter for expo-modules-autolinking.
 *
 * Older autolinking uses `ios` and newer autolinking uses `apple`.
 */
function getIosAutolinkingPlatformParam(projectRoot: string): string {
  let platformParam = 'apple';
  const expoPackageRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  const autolinkingPackageJsonPath = resolveFrom.silent(
    expoPackageRoot ?? projectRoot,
    'expo-modules-autolinking/package.json'
  );
  if (autolinkingPackageJsonPath) {
    const autolinkingPackageJson = require(autolinkingPackageJsonPath);
    // expo-modules-autolinking 1.10.0 added support for apple platform
    if (semver.lt(autolinkingPackageJson.version, '1.10.0')) {
      platformParam = 'ios';
    }
  }
  return platformParam;
}
