import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import chalk from 'chalk';
import type { ExpoConfig, ProjectConfig } from 'expo/config';
import findUp from 'find-up';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getFileBasedHashSourceAsync, stringifyJsonSorted } from './Utils';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';

const debug = require('debug')('expo:fingerprint:sourcer:Expo');

export async function getExpoConfigSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  const results: HashSource[] = [];

  let config: ProjectConfig;
  try {
    const { getConfig } = require(resolveFrom(path.resolve(projectRoot), 'expo/config'));
    config = await getConfig(projectRoot, { skipSDKVersionRequirement: true });
    results.push({
      type: 'contents',
      id: 'expoConfig',
      contents: normalizeExpoConfig(config.exp),
      reasons: ['expoConfig'],
    });
  } catch (e: unknown) {
    debug('Cannot get Expo config: ' + e);
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
  const configPluginSources = getConfigPluginSourcesAsync(projectRoot, config.exp.plugins);
  results.push(...configPluginSources);

  return results;
}

function findUpPluginRoot(entryFile: string): string {
  const entryRoot = path.dirname(entryFile);
  const packageJson = findUp.sync('package.json', { cwd: path.dirname(entryFile) });
  assert(packageJson, `No package.json found for module "${entryRoot}"`);
  return path.dirname(packageJson);
}

function normalizeExpoConfig(config: ExpoConfig): string {
  // Deep clone by JSON.parse/stringify that assumes the config is serializable.
  const normalizedConfig: ExpoConfig = JSON.parse(JSON.stringify(config));
  delete normalizedConfig.runtimeVersion;
  delete normalizedConfig._internal;
  return stringifyJsonSorted(normalizedConfig);
}

function getConfigPluginSourcesAsync(
  projectRoot: string,
  plugins: ExpoConfig['plugins']
): HashSource[] {
  if (plugins == null) {
    return [];
  }

  const reasons = ['expoConfigPlugins'];
  const nullableResults: (HashSource | null)[] = plugins.map((plugin) => {
    const pluginPackageName = Array.isArray(plugin) ? plugin[0] : plugin;
    if (typeof pluginPackageName === 'string') {
      const pluginPackageEntryFile = resolveFrom.silent(projectRoot, pluginPackageName);
      const pluginPackageRoot = pluginPackageEntryFile
        ? findUpPluginRoot(pluginPackageEntryFile)
        : null;
      if (pluginPackageRoot) {
        debug(`Adding config-plugin root - ${chalk.dim(pluginPackageRoot)}`);
        return { type: 'dir', filePath: path.relative(projectRoot, pluginPackageRoot), reasons };
      }
    }
    return null;
  });
  const results = nullableResults.filter(Boolean) as HashSource[];
  return results;
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

  try {
    const reasons = ['expoAutolinkingIos'];
    const results: HashSource[] = [];
    const { stdout } = await spawnAsync(
      'npx',
      ['expo-modules-autolinking', 'resolve', '-p', 'ios', '--json'],
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
