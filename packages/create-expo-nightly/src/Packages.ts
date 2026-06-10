import fs from 'node:fs';
import path from 'node:path';

import { readJsonFileAsync } from './JsonFile.js';
import { runAsync } from './Processes.js';

const EXCLUDE_PACKAGES = [
  '@expo/fingerprint',
  'create-expo',
  'eslint-config-universe',
  'expo-doctor',
  'expo-env-info',
  'expo-module-scripts',
  'expo-module-template',
  'expo-test-runner',
  'install-expo-modules',
  'pod-install',
  'uri-scheme',
  'patch-project',
  'create-expo-module',
  'create-expo-nightly',
  '@react-native-community/cli-platform-android', // mock modules inside expo-modules-autolinkin
  'react', // canary react inside @expo/cli
  'react-dom', // canary react inside @expo/cli
  'sqlite-inspector-webui', // prebuilt bundle from expo-sqlite
];

export const REACT_NATIVE_TRANSITIVE_DEPENDENCIES = [
  // These packages are transitive dependencies from some expo packages, we should also override their versions.
  '@react-native/assets-registry',
  '@react-native/dev-middleware',
  '@react-native/babel-preset',
  'react-native',
];

interface Package {
  name: string;
  path: string;
}

/**
 * Cleanup and reinstall all packages in the given project.
 */
export async function reinstallPackagesAsync(projectRoot: string) {
  await Promise.all([
    fs.promises.rm(path.join(projectRoot, 'node_modules'), { recursive: true, force: true }),
    fs.promises.rm(path.join(projectRoot, 'bun.lock'), { force: true }),
    fs.promises.rm(path.join(projectRoot, 'bun.lockb'), { force: true }),
    fs.promises.rm(path.join(projectRoot, 'yarn.lock'), { force: true }),
  ]);
  await runAsync('pnpm', ['install', '--ignore-scripts'], { cwd: projectRoot });
}

/**
 * Get a list of all react-native transitive dependencies in the expo repo.
 */
export async function getReactNativeTransitivePackagesAsync(
  expoRepoPath: string
): Promise<Package[]> {
  const packages = await Promise.all(
    REACT_NATIVE_TRANSITIVE_DEPENDENCIES.map((name) => {
      const packageRoot = path.join(expoRepoPath, 'node_modules', name);
      return Promise.resolve({ name, path: packageRoot });
    })
  );
  return packages;
}

/**
 * Get the names of every Expo package in the expo repo that can be linked from
 * local source, i.e. everything matched by the `packages/*` and
 * `packages/@expo/*` workspace globs minus the excluded packages.
 */
export async function getExpoPackageNamesAsync(expoRepoPath: string): Promise<Set<string>> {
  const cwd = path.join(expoRepoPath, 'packages');

  const relativePaths = (
    await Promise.all([
      Array.fromAsync(fs.promises.glob('*/package.json', { cwd })),
      Array.fromAsync(fs.promises.glob('@expo/*/package.json', { cwd })),
    ])
  ).flat();

  const names = await Promise.all(
    relativePaths.map(async (relativePath) => {
      const pkg = await createPackageAsync(path.join(cwd, path.dirname(relativePath)));
      return pkg?.name ?? null;
    })
  );

  return new Set(names.filter((name) => name != null));
}

async function createPackageAsync(packageRoot: string): Promise<Package | null> {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packagePath = path.dirname(packageJsonPath);
  const packageJson = await readJsonFileAsync(packageJsonPath);
  const name = packageJson.name as string;
  if (EXCLUDE_PACKAGES.includes(name)) {
    return null;
  }
  return {
    name,
    path: packagePath,
  };
}
