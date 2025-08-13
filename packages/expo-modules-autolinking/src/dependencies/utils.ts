import fs from 'fs';
import path from 'path';

import type { DependencyResolution, ResolutionResult } from './types';

const NODE_MODULES_PATTERN = `${path.sep}node_modules${path.sep}`;

// The default dependencies we exclude don't contain dependency chains leading to autolinked modules
export function defaultShouldIncludeDependency(dependencyName: string): boolean {
  const scopeName =
    dependencyName[0] === '@' ? dependencyName.slice(1, dependencyName.indexOf('/')) : null;
  if (
    scopeName === 'babel' ||
    scopeName === 'types' ||
    scopeName === 'eslint' ||
    scopeName === 'typescript-eslint'
  ) {
    return false;
  }
  switch (dependencyName) {
    case '@expo/cli':
    case '@expo/config':
    case '@expo/metro-config':
    case '@expo/package-manager':
    case '@expo/prebuild-config':
    case '@expo/env':
    case '@react-native/codegen':
    case 'eslint':
    case 'eslint-config-expo':
    case 'eslint-plugin-expo':
      return false;
    default:
      return true;
  }
}

export const fastJoin: (from: string, append: string) => string =
  path.sep === '/'
    ? (from, append) => `${from}${path.sep}${append}`
    : (from, append) =>
        `${from}${path.sep}${append[0] === '@' ? append.replace('/', path.sep) : append}`;

export const maybeRealpath = async (target: string): Promise<string | null> => {
  try {
    return await fs.promises.realpath(target);
  } catch {
    return null;
  }
};

export type PackageJson = Record<string, unknown> & { name: string; version?: string };

export async function loadPackageJson(jsonPath: string): Promise<PackageJson | null> {
  try {
    const packageJsonText = await fs.promises.readFile(jsonPath, 'utf8');
    const json = JSON.parse(packageJsonText);
    if (typeof json !== 'object' || json == null) {
      return null;
    } else if (typeof json.name !== 'string' || !json.name) {
      return null;
    }
    return json;
  } catch {
    return null;
  }
}

export function mergeWithDuplicate(
  a: DependencyResolution,
  b: DependencyResolution
): DependencyResolution {
  let target: DependencyResolution;
  let duplicate: DependencyResolution;
  if (a.depth < b.depth) {
    target = a;
    duplicate = b;
  } else if (b.depth < a.depth) {
    target = b;
    duplicate = a;
  } else {
    // If both are equal, then the shallowest path wins
    const pathDepthA = a.originPath.split(NODE_MODULES_PATTERN).length;
    const pathDepthB = b.originPath.split(NODE_MODULES_PATTERN).length;
    if (pathDepthA < pathDepthB) {
      target = a;
      duplicate = b;
    } else if (pathDepthB < pathDepthA) {
      target = b;
      duplicate = a;
    } else {
      target = a;
      duplicate = b;
    }
  }
  const duplicates = target.duplicates || (target.duplicates = []);
  if (target.path !== duplicate.path) {
    duplicates.push({
      name: duplicate.name,
      version: duplicate.version,
      path: duplicate.path,
      originPath: duplicate.originPath,
    });
  }
  if (duplicate.duplicates?.length) {
    duplicates.push(
      ...duplicate.duplicates.filter((child) =>
        duplicates.every((parent) => parent.path !== child.path)
      )
    );
  }
  return target;
}

export async function filterMapResolutionResult<T extends { name: string }>(
  results: ResolutionResult,
  filterMap: (resolution: DependencyResolution) => Promise<T | null> | T | null
): Promise<Record<string, T>> {
  const resolutions = await Promise.all(
    Object.keys(results).map(async (key) => {
      const resolution = results[key];
      return resolution ? await filterMap(resolution) : null;
    })
  );
  const output: Record<string, T> = Object.create(null);
  for (let idx = 0; idx < resolutions.length; idx++) {
    const resolution = resolutions[idx];
    if (resolution != null) {
      output[resolution.name] = resolution;
    }
  }
  return output;
}

export function mergeResolutionResults(results: ResolutionResult[]) {
  if (results.length === 1) {
    return results[0];
  }
  const output: ResolutionResult = Object.create(null);
  for (let idx = 0; idx < results.length; idx++) {
    for (const key in results[idx]) {
      const resolution = results[idx][key]!;
      const prevResolution = output[key];
      if (prevResolution != null) {
        output[key] = mergeWithDuplicate(prevResolution, resolution);
      } else {
        output[key] = resolution;
      }
    }
  }
  return output;
}
