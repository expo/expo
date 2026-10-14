import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs/promises';
import { glob } from 'glob';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import Git from '../Git';
import logger from '../Logger';
import { spawnErrorOutput } from '../Utils';

const APPS_DIR = path.join(EXPO_DIR, 'apps');
const PACKAGES_DIR = path.join(EXPO_DIR, 'packages');
const TEMPLATES_DIR = path.join(EXPO_DIR, 'templates');

const BUNDLED_NATIVE_MODULES_PATH = path.join(EXPO_DIR, 'packages/expo/bundledNativeModules.json');
const MODULE_TEMPLATE_PACKAGE_JSON_PATH = path.join(
  PACKAGES_DIR,
  'expo-module-template/$package.json'
);

const REACT_NATIVE_PACKAGE = 'react-native';
const REACT_NATIVE_SCOPE = '@react-native/';

export default (program: Command) => {
  program
    .command('bump-react-native-version')
    .alias('bump-rn')
    .option('-v, --version <version>', 'The react-native version to bump to')
    .option('--no-pods', 'Skip installing pods in the apps that commit a Podfile.lock')
    .description(
      'Bumps the react-native and @react-native/* package versions across all packages, apps, and templates in the repo'
    )
    .asyncAction(main);
};

async function main(options: { version?: string; pods: boolean }) {
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

  if (await updateRootOverride(newVersion)) {
    totalUpdated++;
  }

  if (await updateModuleTemplate(newVersion)) {
    totalUpdated++;
  }

  await updateBundledNativeModules(newVersion);

  logger.success(`\nUpdated ${totalUpdated} package.json files and bundledNativeModules.json.\n`);

  logger.info('Running pnpm install...\n');
  await spawnAsync('pnpm', ['install'], { cwd: EXPO_DIR, stdio: 'inherit' });

  if (options.pods && (await shouldInstallPodsAsync())) {
    await installPodsInApps();
  }

  logger.success('Done!');
}

/**
 * Asks whether to install pods. Without a TTY (agents, CI) the prompt's default applies.
 */
async function shouldInstallPodsAsync(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return true;
  }
  const { shouldInstallPods } = await inquirer.prompt<{ shouldInstallPods: boolean }>([
    {
      type: 'confirm',
      name: 'shouldInstallPods',
      message: 'Do you want to install pods in all apps?',
      default: true,
    },
  ]);
  return shouldInstallPods;
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

  // Expo Go Vendored third-party modules shouldn't have their react-native versions bumped
  const appsIgnore = [...ignore, 'expo-go/modules/**'];

  const [appPaths, packagePaths, templatePaths] = await Promise.all([
    glob('**/package.json', { cwd: APPS_DIR, ignore: appsIgnore }),
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
 * Updates the root react-native and @react-native/* overrides. Returns true if the file was modified.
 */
async function updateRootOverride(newVersion: string): Promise<boolean> {
  const { stdout } = await spawnAsync('pnpm', ['config', 'get', 'overrides', '--json'], {
    cwd: EXPO_DIR,
  });
  const overrides = JSON.parse(stdout) as Record<string, string>;
  let modified = false;

  for (const [name, currentVersion] of Object.entries(overrides)) {
    if (
      (name === REACT_NATIVE_PACKAGE || name.startsWith(REACT_NATIVE_SCOPE)) &&
      currentVersion !== '*'
    ) {
      const prefix = currentVersion.match(/^([~^]?)/)?.[1] ?? '';
      const updatedVersion = `${prefix}${newVersion}`;
      if (currentVersion !== updatedVersion) {
        overrides[name] = updatedVersion;
        modified = true;
      }
    }
  }

  if (!modified) return false;

  await spawnAsync(
    'pnpm',
    ['config', 'set', '--location=project', '--json', 'overrides', JSON.stringify(overrides)],
    { cwd: EXPO_DIR }
  );
  logger.log(`  Updated ${chalk.cyan('pnpm-workspace.yaml')} (overrides)`);
  return true;
}

/**
 * Updates react-native and @react-native/* versions in the contents of the module template's
 * `$package.json`. It's an EJS template rather than JSON, so the versions are replaced as text.
 * Only version ranges are replaced, so that peer dependencies such as `"react-native": "*"` stay intact.
 */
export function updateModuleTemplateVersions(contents: string, newVersion: string): string {
  return contents.replace(
    /("(?:react-native|@react-native\/[^"]+)"\s*:\s*")([~^]?)\d[^"]*(")/g,
    (_, start, prefix, end) => `${start}${prefix}${newVersion}${end}`
  );
}

/**
 * Updates react-native and @react-native/* versions in the module template that `create-expo-module`
 * renders into new modules. The `package.json` search skips it because of its `$package.json` name.
 * Returns true if the file was modified.
 */
async function updateModuleTemplate(newVersion: string): Promise<boolean> {
  const contents = await fs.readFile(MODULE_TEMPLATE_PACKAGE_JSON_PATH, 'utf8');
  const updated = updateModuleTemplateVersions(contents, newVersion);
  if (updated === contents) {
    return false;
  }
  await fs.writeFile(MODULE_TEMPLATE_PACKAGE_JSON_PATH, updated);
  logger.log(`  Updated ${chalk.cyan(path.relative(EXPO_DIR, MODULE_TEMPLATE_PACKAGE_JSON_PATH))}`);
  return true;
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
 * Runs `pod install` in the given directory. If it fails with a message suggesting
 * `pod update <dep>`, it automatically runs `pod update <deps> --no-repo-update`,
 * accumulating dependencies across retries. `initialDepsToUpdate` starts with that
 * `pod update` right away (a full install with only those pods unlocked).
 */
async function podInstallAsync(cwd: string, initialDepsToUpdate: string[] = []): Promise<void> {
  const depsToUpdate = new Set<string>(initialDepsToUpdate);

  while (true) {
    try {
      if (depsToUpdate.size > 0) {
        await spawnAsync('pod', ['update', ...depsToUpdate, '--no-repo-update'], { cwd });
      } else {
        await spawnAsync('pod', ['install'], { cwd });
      }
      return;
    } catch (error: any) {
      const output = [error.stdout, error.stderr, error.message].filter(Boolean).join('\n');
      const match = output.match(
        /run ['"`]pod update ([\w\-_\d/]+)( --no-repo-update)?['"`] to apply changes/
      );
      if (!match) {
        throw error;
      }
      const dep = match[1];
      if (depsToUpdate.has(dep)) {
        // Already tried updating this dep — bail to avoid infinite loop
        throw error;
      }
      depsToUpdate.add(dep);
    }
  }
}

/**
 * Maps tracked `ios/Podfile.lock` paths (relative to the repo root) to their unique app directories.
 * Expo Go goes last: it builds React Native from `react-native-lab` and is the slowest.
 */
export function getPodInstallAppDirs(trackedPodfileLocks: string[]): string[] {
  const appDirs = [...new Set(trackedPodfileLocks.map((lock) => path.dirname(path.dirname(lock))))];
  return [...appDirs.filter((dir) => !isExpoGo(dir)), ...appDirs.filter(isExpoGo)];
}

function isExpoGo(appDir: string): boolean {
  return path.basename(appDir) === 'expo-go';
}

/**
 * Runs `pod install` sequentially in every app whose `ios/Podfile.lock` is tracked by git.
 * Only those locks belong in the upgrade PR, and `git ls-files` skips the `apps/eas-expo-go/ios`
 * symlink to `apps/expo-go/ios` and the apps that gitignore their lock. One install at a time
 * avoids concurrent CocoaPods writes to the same Pods directory.
 */
async function installPodsInApps(): Promise<void> {
  const { stdout } = await Git.runAsync(['ls-files', '--', 'apps/*/ios/Podfile.lock']);
  const appDirs = getPodInstallAppDirs(stdout.trim().split('\n').filter(Boolean));
  const failedAppDirs: string[] = [];

  logger.info(`\nInstalling pods in ${appDirs.length} apps...\n`);

  for (const appDir of appDirs) {
    const spinner = ora({ text: `Installing pods in ${chalk.cyan(appDir)}`, indent: 2 }).start();
    try {
      if (isExpoGo(appDir)) {
        // Expo Go builds React Native from react-native-lab, whose codegen output is gitignored
        // and must be rebuilt after the submodule moves, or `pod install` fails in codegen.
        await spawnAsync('pnpm', ['run', 'install:react-native-lab'], { cwd: EXPO_DIR });
      }
      // In Expo Go, hermes-engine is an external podspec at a fixed react-native-lab path, so a
      // plain `pod install` reuses the cached podspec and keeps the old Hermes version in the lock.
      await podInstallAsync(
        path.join(EXPO_DIR, appDir, 'ios'),
        isExpoGo(appDir) ? ['hermes-engine'] : []
      );
      spinner.succeed(`Installed pods in ${chalk.cyan(appDir)}`);
    } catch (error: any) {
      spinner.fail(`Failed to install pods in ${appDir}`);
      logger.error(spawnErrorOutput(error).split('\n').slice(-40).join('\n'));
      failedAppDirs.push(appDir);
    }
  }

  if (failedAppDirs.length > 0) {
    throw new Error(
      `Pod install failed in ${failedAppDirs.join(', ')}. Fix the errors above, then run ` +
        '`pod install` in the ios directory of each listed app ' +
        '(for expo-go: `pod update hermes-engine --no-repo-update`).'
    );
  }
}
