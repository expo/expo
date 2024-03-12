import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import type { ExpoConfig, ProjectConfig } from 'expo/config';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import { getExpoConfigLoaderPath } from './ExpoConfigLoader';
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
  let loadedModules: string[] = [];
  const ignoredFile = await createTempIgnoredFileAsync(options);
  try {
    const { stdout } = await spawnAsync(
      'node',
      [getExpoConfigLoaderPath(), path.resolve(projectRoot), ignoredFile],
      { cwd: __dirname }
    );
    const stdoutJson = JSON.parse(stdout);
    config = stdoutJson.config;
    loadedModules = stdoutJson.loadedModules;
    results.push({
      type: 'contents',
      id: 'expoConfig',
      contents: normalizeExpoConfig(config.exp),
      reasons: ['expoConfig'],
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.warn(`Cannot get Expo config from an Expo project - ${e.message}: `, e.stack);
    }
    return [];
  }

  // external files in config
  const isAndroid = options.platforms.includes('android');
  const isIos = options.platforms.includes('ios');
  const externalFiles = [
    // icons
    config.exp.icon,
    isAndroid ? config.exp.android?.icon : undefined,
    isIos ? config.exp.ios?.icon : undefined,
    isAndroid ? config.exp.android?.adaptiveIcon?.foregroundImage : undefined,
    isAndroid ? config.exp.android?.adaptiveIcon?.backgroundImage : undefined,
    config.exp.notification?.icon,

    // splash images
    config.exp.splash?.image,
    isAndroid ? config.exp.android?.splash?.image : undefined,
    isAndroid ? config.exp.android?.splash?.mdpi : undefined,
    isAndroid ? config.exp.android?.splash?.hdpi : undefined,
    isAndroid ? config.exp.android?.splash?.xhdpi : undefined,
    isAndroid ? config.exp.android?.splash?.xxhdpi : undefined,
    isAndroid ? config.exp.android?.splash?.xxxhdpi : undefined,
    isIos ? config.exp.ios?.splash?.image : undefined,
    isIos ? config.exp.ios?.splash?.tabletImage : undefined,

    // google service files
    isAndroid ? config.exp.android?.googleServicesFile : undefined,
    isIos ? config.exp.ios?.googleServicesFile : undefined,
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

function normalizeExpoConfig(config: ExpoConfig): string {
  // Deep clone by JSON.parse/stringify that assumes the config is serializable.
  const normalizedConfig: ExpoConfig = JSON.parse(JSON.stringify(config));
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
  delete normalizedConfig._internal;
  return stringifyJsonSorted(normalizedConfig);
}

/**
 * Create a temporary file with ignored paths from options that will be read by the ExpoConfigLoader.
 */
async function createTempIgnoredFileAsync(options: NormalizedOptions): Promise<string> {
  await fs.mkdtemp(path.join(os.tmpdir(), 'expo-fingerprint-'));
  const ignoredFile = path.join(os.tmpdir(), '.fingerprintignore');
  await fs.writeFile(ignoredFile, options.ignorePaths.join('\n'));
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
