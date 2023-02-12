import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

export function resolveExpoUpdatesVersion(projectRoot: string): string | null {
  let expoUpdatesBuildPath;
  try {
    expoUpdatesBuildPath = resolveFrom(projectRoot, 'expo-updates');
  } catch {
    // this is expected in projects that don't have expo-updates installed
    return null;
  }
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
