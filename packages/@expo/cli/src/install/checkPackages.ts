import { getConfig } from '@expo/config';
import type * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';

import * as Log from '../log';
import {
  getVersionedDependenciesAsync,
  logIncorrectDependencies,
} from '../start/doctor/dependencies/validateDependenciesVersions';
import { isInteractive } from '../utils/interactive';
import { learnMore } from '../utils/link';
import { confirmAsync } from '../utils/prompts';
import { joinWithCommasAnd } from '../utils/strings';
import { debugEvent } from './events';
import { fixPackagesAsync } from './fixPackages';
import type { Options } from './resolveOptions';
import { isExpoManagedDependencyAsync } from './utils/isExpoManagedDependency';

/**
 * Handles `expo install --fix|check'.
 * Checks installed dependencies against bundledNativeModules and versions endpoints to find any incompatibilities.
 * If `--fix` is passed, it will install the correct versions of the dependencies.
 * If `--check` is passed, it will prompt the user to install the correct versions of the dependencies (on interactive terminal).
 */
export async function checkPackagesAsync(
  projectRoot: string,
  {
    packages,
    packageManager,
    options: { fix, json, expoOnly },
    packageManagerArguments,
  }: {
    /**
     * List of packages to version
     * @example ['uuid', 'react-native-reanimated@latest']
     */
    packages: string[];
    /** Package manager to use when installing the versioned packages. */
    packageManager: PackageManager.NodePackageManager;

    /** How the check should resolve */
    options: Pick<Options, 'fix' | 'json' | 'expoOnly'>;
    /**
     * Extra parameters to pass to the `packageManager` when installing versioned packages.
     * @example ['--no-save']
     */
    packageManagerArguments: string[];
  }
) {
  // Read the project Expo config without plugins.
  const { exp, pkg } = getConfig(projectRoot, {
    // Sometimes users will add a plugin to the config before installing the library,
    // this wouldn't work unless we dangerously disable plugin serialization.
    skipPlugins: true,
  });

  if (pkg.expo?.install?.exclude?.length && !json) {
    Log.log(
      chalk`Skipped ${fix ? 'fixing' : 'checking'} dependencies: ${joinWithCommasAnd(
        pkg.expo.install.exclude
      )}. These dependencies are listed in {bold expo.install.exclude} in package.json. ${learnMore(
        'https://docs.expo.dev/more/expo-cli/#configuring-dependency-validation'
      )}`
    );
  }

  const incorrectDependencies = await getVersionedDependenciesAsync(projectRoot, exp, pkg, packages);
  const dependencies = expoOnly
    ? await filterExpoManagedDependenciesAsync(projectRoot, incorrectDependencies)
    : incorrectDependencies;

  if (!dependencies.length) {
    if (json) {
      console.log(JSON.stringify({ dependencies: [], upToDate: true }));
    } else {
      Log.exit(chalk.greenBright('Dependencies are up to date'), 0);
    }
    return;
  }

  if (json) {
    console.log(JSON.stringify({ dependencies, upToDate: false }, null, 2));
    // Exit with non-zero exit code to indicate outdated dependencies
    process.exit(1);
  }

  logIncorrectDependencies(dependencies);

  const value =
    // If `--fix` then always fix.
    fix ||
    // Otherwise prompt to fix when not running in CI.
    (isInteractive() && (await confirmAsync({ message: 'Fix dependencies?' }).catch(() => false)));

  if (value) {
    debugEvent('fixing_dependencies', { packages: dependencies.map((d) => d.packageName) });
    // Install the corrected dependencies.
    return fixPackagesAsync(projectRoot, {
      packageManager,
      packages: dependencies,
      packageManagerArguments,
      sdkVersion: exp.sdkVersion!,
      expoOnly: !!expoOnly,
    });
  }

  // Exit with non-zero exit code if any of the dependencies are out of date.
  Log.exit(chalk.red('Found outdated dependencies'), 1);
}

/**
 * Keep only dependencies maintained by Expo for `--expo-only` checks/fixes.
 */
async function filterExpoManagedDependenciesAsync(
  projectRoot: string,
  dependencies: Awaited<ReturnType<typeof getVersionedDependenciesAsync>>
) {
  const expoManagedCache = new Map<string, Promise<boolean>>();
  const expoManaged = await Promise.all(
    dependencies.map(async (dependency) => {
      let cached = expoManagedCache.get(dependency.packageName);
      if (!cached) {
        cached = isExpoManagedDependencyAsync(projectRoot, dependency.packageName);
        expoManagedCache.set(dependency.packageName, cached);
      }
      const isExpoManaged = await cached;
      return isExpoManaged ? dependency : null;
    })
  );

  return expoManaged.filter(Boolean) as typeof dependencies;
}
