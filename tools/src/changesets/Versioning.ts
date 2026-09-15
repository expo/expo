import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'node:path';

import { EXPO_DIR } from '../Constants';
import { getListOfPackagesAsync } from '../Packages';
import { spawnAsync } from '../Utils';

export type VersionDerivedPackage = { name: string; path: string; after: string };
export type VersionedPackage = VersionDerivedPackage & { before: string };

export async function captureWorkspaceVersionsAsync(): Promise<Map<string, string>> {
  return new Map(
    (await getListOfPackagesAsync()).map((pkg) => [pkg.packageName, pkg.packageVersion])
  );
}

export async function getVersionedPackagesAsync(
  before: Map<string, string>
): Promise<VersionedPackage[]> {
  const packages = await getListOfPackagesAsync();
  return await Promise.all(
    packages.flatMap((pkg) => {
      const previousVersion = before.get(pkg.packageName);
      if (!previousVersion) return [];
      return [
        fs.readJson(path.join(pkg.path, 'package.json')).then((manifest) => ({
          name: pkg.packageName,
          path: pkg.path,
          before: previousVersion,
          after: manifest.version as string,
        })),
      ];
    })
  ).then((entries) => entries.filter((entry) => entry.before !== entry.after));
}

export async function updateVersionDerivedFilesAsync(
  versionedPackages: VersionDerivedPackage[],
  canary = false,
  root = EXPO_DIR
): Promise<void> {
  await updateBundledNativeModulesAsync(versionedPackages, canary, root);
  await updateModuleTemplateAsync(versionedPackages, canary, root);
  await updateAndroidVersionsAsync(versionedPackages);
}

export async function refreshPnpmLockfileAsync(): Promise<void> {
  await spawnAsync('pnpm', ['install', '--lockfile-only', '--offline'], {
    cwd: EXPO_DIR,
    stdio: 'inherit',
    env: { ...process.env, EXPO_NONINTERACTIVE: '1' },
  });
}

async function updateBundledNativeModulesAsync(
  packages: VersionDerivedPackage[],
  canary: boolean,
  root: string
): Promise<void> {
  const filePath = path.join(root, 'packages/expo/bundledNativeModules.json');
  const bundled = await JsonFile.readAsync<Record<string, string>>(filePath);
  let changed = false;
  for (const pkg of packages) {
    if (bundled[pkg.name] === undefined) continue;
    bundled[pkg.name] = `${canary ? '' : '~'}${pkg.after}`;
    changed = true;
  }
  if (changed) await JsonFile.writeAsync(filePath, bundled);
}

async function updateModuleTemplateAsync(
  packages: VersionDerivedPackage[],
  canary: boolean,
  root: string
): Promise<void> {
  const versions = new Map(
    packages
      .filter((pkg) => ['expo-modules-core', 'expo-module-scripts', 'expo'].includes(pkg.name))
      .map((pkg) => [pkg.name, pkg.after])
  );
  if (!versions.size) return;

  const filePath = path.join(root, 'packages/expo-module-template/$package.json');
  let contents = await fs.readFile(filePath, 'utf8');
  for (const [name, version] of versions) {
    const expression = new RegExp(`("${escapeRegExp(name)}"\\s*:\\s*")([^"]+)(")`);
    contents = contents.replace(expression, `$1${canary ? version : `^${version}`}$3`);
  }
  await fs.writeFile(filePath, contents);
}

async function updateAndroidVersionsAsync(packages: VersionDerivedPackage[]): Promise<void> {
  for (const pkg of packages) {
    if (pkg.name === 'expo-module-template') continue;
    const filePath = path.join(pkg.path, 'android/build.gradle');
    if (!(await fs.pathExists(filePath))) continue;
    const contents = await fs.readFile(filePath, 'utf8');
    const updated = contents.replace(
      /\b(version\s*=\s*|versionName\s+)(['"])(.*?)\2/g,
      `$1$2${pkg.after}$2`
    );
    if (updated !== contents) await fs.writeFile(filePath, updated);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
