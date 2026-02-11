import fs from 'node:fs';
import path from 'node:path';

import { mergeJsonFilesAsync, readJsonFileAsync } from './JsonFile.js';
import { runAsync } from './Processes.js';

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
 * Add given workspace packages to the project.
 */
export async function addWorkspacePackagesToAppAsync(projectRoot: string, packages: Package[]) {
  const packageJson = await readJsonFileAsync(path.join(projectRoot, 'package.json'));
  const dependencies: Record<string, string> =
    (packageJson.dependencies as Record<string, string>) ?? {};
  for (const pkg of packages) {
    dependencies[pkg.name] = 'workspace:*';
  }
  await mergeJsonFilesAsync(path.join(projectRoot, 'package.json'), { dependencies });
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
  await runAsync('bun', ['install', '--ignore-scripts'], { cwd: projectRoot });
}

/**
 * Get a list of all expo packages in the expo repo.
 */
export async function getExpoPackagesAsync(expoRepoPath: string): Promise<Package[]> {
  if (cachedPackages != null) {
    return cachedPackages;
  }

  const paths = await Array.fromAsync(
    fs.promises.glob('**/package.json', {
      cwd: path.join(expoRepoPath, 'packages'),
      exclude: [
        '**/example/**',
        '**/node_modules/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/__fixtures__/**',
        '**/e2e/**',
        '**/build/**',
        '@expo/cli/local-template/**',
      ],
    })
  );
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
