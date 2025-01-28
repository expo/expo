import { glob } from 'glob';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import { runAsync } from './Processes.js';

const require = createRequire(import.meta.url);
const { default: JsonFile } = require('@expo/json-file') as typeof import('@expo/json-file');

let cachedPackages: Package[] | null = null;

const EXCLUDE_PACKAGES = [
  '@expo/fingerprint',
  'create-expo',
  'eslint-config-universe',
  'expo-dev-client-components',
  'expo-doctor',
  'expo-env-info',
  'expo-module-scripts',
  'expo-module-template',
  'expo-module-template-local',
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
 * Add given workspace packages to the project.
 */
export async function addWorkspacePackagesToAppAsync(projectRoot: string, packages: Package[]) {
  const packageJson = await JsonFile.readAsync(path.join(projectRoot, 'package.json'));
  const dependencies: Record<string, string> =
    (packageJson.dependencies as Record<string, string>) ?? {};
  for (const pkg of packages) {
    dependencies[pkg.name] = 'workspace:*';
  }
  await JsonFile.mergeAsync(path.join(projectRoot, 'package.json'), { dependencies });
}

/**
 * Cleanup and reinstall all packages in the given project.
 */
export async function reinstallPackagesAsync(projectRoot: string) {
  await Promise.all([
    fs.rm(path.join(projectRoot, 'node_modules'), { recursive: true, force: true }),
    fs.rm(path.join(projectRoot, 'bun.lock'), { force: true }),
    fs.rm(path.join(projectRoot, 'bun.lockb'), { force: true }),
    fs.rm(path.join(projectRoot, 'yarn.lock'), { force: true }),
  ]);
  await runAsync('bun', ['install', '--ignore-scripts'], { cwd: projectRoot });
}

/**
 * Get a list of all expo packages in the expo repo.
 */
export async function getExpoPackagesAsync(expoRepoPath: string): Promise<Package[]> {
  if (cachedPackages != null) {
    return cachedPackages;
  }

  const paths = await glob('**/package.json', {
    cwd: path.join(expoRepoPath, 'packages'),
    ignore: [
      '**/example/**',
      '**/node_modules/**',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/__fixtures__/**',
      '**/e2e/**',
      '**/build/**',
    ],
  });
  const packages = (
    await Promise.all(
      paths.map(async (packageJsonName) => {
        const packageRoot = path.join(expoRepoPath, 'packages', path.dirname(packageJsonName));
        return await createPackageAsync(packageRoot);
      })
    )
  ).filter((pkg) => pkg != null) as Package[];

  cachedPackages = packages.sort((a, b) => a.name.localeCompare(b.name));
  return cachedPackages;
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

async function createPackageAsync(packageRoot: string): Promise<Package | null> {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packagePath = path.dirname(packageJsonPath);
  const packageJson = await JsonFile.readAsync(packageJsonPath);
  const name = packageJson.name as string;
  if (EXCLUDE_PACKAGES.includes(name)) {
    return null;
  }
  return {
    name,
    path: packagePath,
  };
}
