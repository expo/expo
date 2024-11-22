import resolveFrom from 'resolve-from';
import semver from 'semver';

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
 * Resolve the version of `expo-modules-autolinking` package in the project.
 */
export function resolveExpoAutolinkingVersion(projectRoot: string): string | null {
  const expoPackageRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  const autolinkingPackageJsonPath = resolveFrom.silent(
    expoPackageRoot ?? projectRoot,
    'expo-modules-autolinking/package.json'
  );
  if (autolinkingPackageJsonPath) {
    const autolinkingPackageJson = require(autolinkingPackageJsonPath);
    return autolinkingPackageJson.version;
  }
  return null;
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
