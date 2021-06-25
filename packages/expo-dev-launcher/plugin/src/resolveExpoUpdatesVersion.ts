import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

export function resolveExpoUpdatesVersion(projectRoot: string): string | null {
  const expoUpdatesBuildPath = resolveFrom(projectRoot, 'expo-updates');
  if (!expoUpdatesBuildPath) {
    return null;
  }
  const expoUpdatesPackageJsonPath = path.resolve(
    path.dirname(expoUpdatesBuildPath),
    '../package.json'
  );
  if (!fs.existsSync(expoUpdatesPackageJsonPath)) {
    return null;
  }
  const packageJsonString = fs.readFileSync(expoUpdatesPackageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonString);
  return packageJson.version;
}
