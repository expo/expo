import path from 'path';

import { taskAll } from '../concurrency';
import {
  DependencyResolutionSource,
  type DependencyResolution,
  type ResolutionResult,
} from './types';

const NODE_MODULES_PATTERN = `${path.sep}node_modules${path.sep}`;

// The default dependencies we exclude don't contain dependency chains leading to autolinked modules
export function defaultShouldIncludeDependency(dependencyName: string): boolean {
  const scopeName =
    dependencyName[0] === '@' ? dependencyName.slice(1, dependencyName.indexOf('/')) : null;
  if (
    scopeName === 'babel' ||
    scopeName === 'types' ||
    scopeName === 'eslint' ||
    scopeName === 'typescript-eslint' ||
    scopeName === 'testing-library' ||
    scopeName === 'aws-crypto' ||
    scopeName === 'aws-sdk'
  ) {
    return false;
  }
  switch (dependencyName) {
    case '@expo/cli':
    case '@expo/config':
    case '@expo/metro-config':
    case '@expo/package-manager':
    case '@expo/prebuild-config':
    case '@expo/webpack-config':
    case '@expo/env':
    case '@react-native/codegen':
    case '@react-native/community-cli-plugin':
    case 'eslint':
    case 'eslint-config-expo':
    case 'eslint-plugin-expo':
    case 'eslint-plugin-import':
    case 'jest-expo':
    case 'jest':
    case 'metro':
    case 'ts-node':
    case 'typescript':
    case 'webpack':
      return false;
    default:
      return true;
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
    if (duplicates.every((parent) => parent.path !== duplicate.path)) {
      duplicates.push({
        name: duplicate.name,
        version: duplicate.version,
        path: duplicate.path,
        originPath: duplicate.originPath,
      });
    }
  } else if (!target.version && duplicate.version) {
    target.version = duplicate.version;
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
  const resolutions = await taskAll(Object.keys(results), async (key) => {
    const resolution = results[key];
    const result = resolution ? await filterMap(resolution) : null;
    // If we failed to find a matching resolution from `searchPaths`, also try the other duplicates
    // to see if the `searchPaths` result is not a module but another is
    if (resolution?.source === DependencyResolutionSource.SEARCH_PATH && !result) {
      for (let idx = 0; resolution.duplicates && idx < resolution.duplicates.length; idx++) {
        const duplicate = resolution.duplicates[idx];
        const duplicateResult = await filterMap({ ...resolution, ...duplicate });
        if (duplicateResult != null) {
          return duplicateResult;
        }
      }
    }
    return result;
  });
  const output: Record<string, T> = Object.create(null);
  for (let idx = 0; idx < resolutions.length; idx++) {
    const resolution = resolutions[idx];
    if (resolution != null) {
      output[resolution.name] = resolution;
    }
  }
  return output;
}

export function mergeResolutionResults(
  results: ResolutionResult[],
  base?: ResolutionResult
): ResolutionResult {
  if (base == null && results.length === 1) {
    return results[0];
  }
  const output: ResolutionResult = base == null ? Object.create(null) : base;
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
