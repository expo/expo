import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import chalk from 'chalk';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getFileBasedHashSourceAsync } from './Utils';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';

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
    const autolinkingConfig: Record<string, any> = {};
    for (const [depName, depData] of Object.entries<any>(config.dependencies)) {
      stripRncliAutolinkingAbsolutePaths(depData, root);
      const filePath = depData.root;
      debug(`Adding react-native-cli autolinking dir - ${chalk.dim(filePath)}`);
      results.push({ type: 'dir', filePath, reasons });

      autolinkingConfig[depName] = depData;
    }

    results.push({
      type: 'contents',
      id: 'rncliAutolinkingConfig',
      contents: JSON.stringify(autolinkingConfig),
      reasons,
    });
    return results;
  } catch {
    return [];
  }
}

function stripRncliAutolinkingAbsolutePaths(dependency: any, root: string): void {
  assert(dependency.root);
  const dependencyRoot = dependency.root;
  dependency.root = path.relative(root, dependencyRoot);
  for (const platformData of Object.values<any>(dependency.platforms)) {
    for (const [key, value] of Object.entries<any>(platformData)) {
      platformData[key] = value.startsWith?.(dependencyRoot) ? path.relative(root, value) : value;
    }
  }
}
