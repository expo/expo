import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import path from 'path';
import resolveFrom from 'resolve-from';

import type { HashSource, NormalizedOptions, Platform } from '../Fingerprint.types';
import { getFileBasedHashSourceAsync } from './Utils';

const debug = require('debug')('expo:fingerprint:sourcer:Bare');

export async function getBareAndroidSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (options.platforms.includes('android')) {
    const result = await getFileBasedHashSourceAsync(projectRoot, 'android', 'bareNativeDir');
    if (result != null) {
      debug(`Adding bare native dir - ${chalk.dim('android')}`);
      return [result];
    }
  }
  return [];
}

export async function getBareIosSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (options.platforms.includes('ios')) {
    const result = await getFileBasedHashSourceAsync(projectRoot, 'ios', 'bareNativeDir');
    if (result != null) {
      debug(`Adding bare native dir - ${chalk.dim('ios')}`);
      return [result];
    }
  }
  return [];
}

export async function getPackageJsonScriptSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
) {
  let packageJson;
  try {
    packageJson = require(resolveFrom(path.resolve(projectRoot), './package.json'));
  } catch (e: unknown) {
    debug(`Unable to read package.json from ${path.resolve(projectRoot)}/package.json: ` + e);
    return [];
  }
  const results: HashSource[] = [];
  if (packageJson.scripts) {
    debug(`Adding package.json contents - ${chalk.dim('scripts')}`);
    const id = 'packageJson:scripts';
    results.push({
      type: 'contents',
      id,
      contents: JSON.stringify(packageJson.scripts),
      reasons: [id],
    });
  }
  return results;
}

export async function getGitIgnoreSourcesAsync(projectRoot: string, options: NormalizedOptions) {
  const result = await getFileBasedHashSourceAsync(projectRoot, '.gitignore', 'bareGitIgnore');
  if (result != null) {
    debug(`Adding file - ${chalk.dim('.gitignore')}`);
    return [result];
  }
  return [];
}

export async function getRncliAutolinkingSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  try {
    const results: HashSource[] = [];
    const { stdout } = await spawnAsync('npx', ['react-native', 'config'], { cwd: projectRoot });
    const config = JSON.parse(stdout);
    const { root } = config;
    const reasons = ['bareRncliAutolinking'];
    for (const depData of Object.values<any>(config.dependencies)) {
      const filePath = path.relative(root, depData.root);
      results.push({ type: 'dir', filePath, reasons });
      debug(`Adding react-native-cli autolinking dir - ${chalk.dim(filePath)}`);
      for (const platform of options.platforms) {
        const platformData = getRncliPlatformData(depData, root, platform);
        if (platformData) {
          results.push({
            type: 'contents',
            id: `rncliAutolinkingConfig:${depData.name}:${platform}`,
            contents: platformData,
            reasons,
          });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

function getRncliPlatformData(dependency: any, root: string, platform: Platform): string {
  const platformData = dependency.platforms[platform];
  if (!platformData) {
    return '';
  }
  const json: Record<string, string> = {};
  for (const [key, value] of Object.entries<any>(platformData)) {
    json[key] = value?.startsWith?.(root) ? path.relative(root, value) : value;
  }
  return JSON.stringify(json);
}
