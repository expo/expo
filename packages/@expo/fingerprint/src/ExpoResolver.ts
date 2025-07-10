import path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';

let cachedExpoAutolinkingPackageRoot: [string, string] | null = null;

/**
 * Resolve the version of `expo` package in the project.
 */
export function resolveExpoVersion(projectRoot: string): string | null {
  const expoPackageJsonPath = resolveFrom.silent(projectRoot, 'expo/package.json');
  if (expoPackageJsonPath) {
    const expoPackageJson = require(expoPackageJsonPath);
    return expoPackageJson.version;
  }
  return null;
}

/**
 * Resolve the path to the `@expo/env` package in the project.
 */
export function resolveExpoEnvPath(projectRoot: string): string | null {
  const expoPackageRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  const expoEnvPackageJsonPath = resolveFrom.silent(
    expoPackageRoot ?? projectRoot,
    '@expo/env/package.json'
  );
  if (expoEnvPackageJsonPath) {
    return path.dirname(expoEnvPackageJsonPath);
  }
  return null;
}

/**
 * Resolve the package root of `expo-modules-autolinking` package in the project.
 */
export function resolveExpoAutolinkingPackageRoot(projectRoot: string): string | null {
  if (cachedExpoAutolinkingPackageRoot) {
    const [cachedProjectRoot, cachedPackageRoot] = cachedExpoAutolinkingPackageRoot;
    if (cachedProjectRoot === projectRoot) {
      return cachedPackageRoot;
    }
  }
  const expoPackageRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  const autolinkingPackageJsonPath = resolveFrom.silent(
    expoPackageRoot ?? projectRoot,
    'expo-modules-autolinking/package.json'
  );
  if (autolinkingPackageJsonPath) {
    const autolinkingPackageRoot = path.dirname(autolinkingPackageJsonPath);
    cachedExpoAutolinkingPackageRoot = [projectRoot, autolinkingPackageRoot];
    return autolinkingPackageRoot;
  }
  return null;
}

/**
 * Resolve the path to the `expo-modules-autolinking` CLI in the project.
 * @throws If the package is not found in the project.
 */
export function resolveExpoAutolinkingCliPath(projectRoot: string): string {
  const autolinkingPackageRoot = resolveExpoAutolinkingPackageRoot(projectRoot);
  if (autolinkingPackageRoot == null) {
    throw new Error('Cannot resolve expo-modules-autolinking package in the project.');
  }
  return path.join(autolinkingPackageRoot, 'bin', 'expo-modules-autolinking.js');
}

/**
 * Resolve the version of `expo-modules-autolinking` package in the project.
 */
export function resolveExpoAutolinkingVersion(projectRoot: string): string | null {
  const autolinkingPackageRoot = resolveExpoAutolinkingPackageRoot(projectRoot);
  if (autolinkingPackageRoot) {
    const autolinkingPackageJson = require(path.join(autolinkingPackageRoot, 'package.json'));
    return autolinkingPackageJson.version;
  }
  return null;
}

/**
 * Resolve the package root of `expo/config-plugins` package in the project.
 */
export function resolveExpoConfigPluginsPackagePath(projectRoot: string): string | null {
  return resolveFrom.silent(projectRoot, 'expo/config-plugins') ?? null;
}

/**
 * Resolve the `expo` package version and check if it satisfies the provided semver range.
 * @returns `null` if the `expo` package is not found in the project.
 */
export function satisfyExpoVersion(projectRoot: string, range: string): boolean | null {
  const expoVersion = resolveExpoVersion(projectRoot);
  if (expoVersion) {
    return semver.satisfies(expoVersion, range);
  }
  return null;
}
