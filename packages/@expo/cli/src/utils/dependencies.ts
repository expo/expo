import { getPackageJson } from '@expo/config';

/** @returns true if the expo-dev-client package is found in the project `package.json` file. */
export function hasDirectDevClientDependency(projectRoot: string): boolean {
  const pkg = getPackageJson(projectRoot);
  return !!pkg.dependencies?.['expo-dev-client'] || !!pkg.devDependencies?.['expo-dev-client'];
}
