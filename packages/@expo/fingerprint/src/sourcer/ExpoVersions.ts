import resolveFrom from 'resolve-from';

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
