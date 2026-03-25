import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { glob } from 'glob';
import inquirer from 'inquirer';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';

const APPS_DIR = path.join(EXPO_DIR, 'apps');
const PACKAGES_DIR = path.join(EXPO_DIR, 'packages');
const TEMPLATES_DIR = path.join(EXPO_DIR, 'templates');

const BUNDLED_NATIVE_MODULES_PATH = path.join(EXPO_DIR, 'packages/expo/bundledNativeModules.json');

const REACT_NATIVE_PACKAGE = 'react-native';
const REACT_NATIVE_SCOPE = '@react-native/';

export default (program: Command) => {
  program
    .command('bump-react-native-version')
    .alias('bump-rn')
    .option('-v, --version <version>', 'The react-native version to bump to')
    .description(
      'Bumps the react-native and @react-native/* package versions across all packages, apps, and templates in the repo'
    )
    .asyncAction(main);
};

async function main(options: { version?: string }) {
  const newVersion = options.version;
  if (!newVersion) {
    throw new Error('Please provide a version using --version <version>');
  }

  logger.info(`Bumping react-native version to ${chalk.bold(newVersion)} across the monorepo...\n`);

  const packageJsonPaths = await findAllPackageJsonPaths();
  let totalUpdated = 0;

  for (const packageJsonPath of packageJsonPaths) {
    const updated = await updatePackageJson(packageJsonPath, newVersion);
    if (updated) {
      totalUpdated++;
    }
  }

  await updateBundledNativeModules(newVersion);

  logger.success(`\nUpdated ${totalUpdated} package.json files and bundledNativeModules.json.\n`);

  logger.info('Running pnpm install...\n');
  await spawnAsync('pnpm', ['install'], { cwd: EXPO_DIR, stdio: 'inherit' });

  const { shouldInstallPods } = await inquirer.prompt<{ shouldInstallPods: boolean }>([
    {
      type: 'confirm',
      name: 'shouldInstallPods',
      message: 'Do you want to install pods in all apps?',
      default: true,
    },
  ]);

  if (shouldInstallPods) {
    await installPodsInApps();
  }

  logger.success('Done!');
}

/**
 * Finds all package.json files in apps, packages, and templates directories.
 */
async function findAllPackageJsonPaths(): Promise<string[]> {
  const ignore = [
    '**/node_modules/**',
    '**/example/**',
    '**/__tests__/**',
    '**/__mocks__/**',
    '**/__fixtures__/**',
  ];

  const [appPaths, packagePaths, templatePaths] = await Promise.all([
    glob('**/package.json', { cwd: APPS_DIR, ignore }),
    glob('**/package.json', { cwd: PACKAGES_DIR, ignore }),
    glob('*/package.json', { cwd: TEMPLATES_DIR, ignore }),
  ]);

  return [
    ...appPaths.map((p) => path.join(APPS_DIR, p)),
    ...packagePaths.map((p) => path.join(PACKAGES_DIR, p)),
    ...templatePaths.map((p) => path.join(TEMPLATES_DIR, p)),
  ];
}

/**
 * Updates react-native and @react-native/* versions in a single package.json file.
 * Returns true if the file was modified.
 */
async function updatePackageJson(packageJsonPath: string, newVersion: string): Promise<boolean> {
  const json = await JsonFile.readAsync(packageJsonPath);
  const depFields = ['dependencies', 'devDependencies', 'peerDependencies'] as const;
  let modified = false;

  for (const field of depFields) {
    const deps = json[field] as Record<string, string> | undefined;
    if (!deps) continue;

    for (const [name, currentVersion] of Object.entries(deps)) {
      if (name === REACT_NATIVE_PACKAGE || name.startsWith(REACT_NATIVE_SCOPE)) {
        // Skip wildcard versions
        if (currentVersion === '*') continue;

        // Preserve version prefix (^, ~, etc.) if present
        const prefixMatch = currentVersion.match(/^([~^]?)/);
        const prefix = prefixMatch?.[1] ?? '';
        const updatedVersion = `${prefix}${newVersion}`;

        if (currentVersion !== updatedVersion) {
          deps[name] = updatedVersion;
          modified = true;
        }
      }
    }
  }

  if (modified) {
    await JsonFile.writeAsync(packageJsonPath, json);
    const relativePath = path.relative(EXPO_DIR, packageJsonPath);
    logger.log(`  Updated ${chalk.cyan(relativePath)}`);
  }

  return modified;
}

/**
 * Updates react-native version in bundledNativeModules.json.
 */
async function updateBundledNativeModules(newVersion: string): Promise<void> {
  const json = await JsonFile.readAsync(BUNDLED_NATIVE_MODULES_PATH);
  const currentVersion = json[REACT_NATIVE_PACKAGE] as string | undefined;

  if (currentVersion && currentVersion !== newVersion) {
    json[REACT_NATIVE_PACKAGE] = newVersion;
    await JsonFile.writeAsync(BUNDLED_NATIVE_MODULES_PATH, json);
    logger.log(`  Updated ${chalk.cyan('packages/expo/bundledNativeModules.json')}`);
  }
}

/**
 * Finds all apps with an ios directory containing a Podfile and runs `bunx pod-install` in them.
 */
async function installPodsInApps(): Promise<void> {
  const podfiles = await glob('**/ios/Podfile', {
    cwd: APPS_DIR,
    ignore: ['**/node_modules/**'],
  });

  const appDirs = [
    ...new Set(podfiles.map((p) => path.join(APPS_DIR, path.dirname(path.dirname(p))))),
  ];

  logger.info(`\nInstalling pods in ${appDirs.length} apps...\n`);

  for (const appDir of appDirs) {
    const relativePath = path.relative(EXPO_DIR, appDir);
    logger.log(`  Installing pods in ${chalk.cyan(relativePath)}...`);
    try {
      await spawnAsync('bunx', ['pod-install'], { cwd: appDir, stdio: 'inherit' });
    } catch (error: any) {
      logger.warn(`  Failed to install pods in ${relativePath}: ${error.message}`);
    }
  }
}
