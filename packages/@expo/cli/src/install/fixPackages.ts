import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';

import { applyPluginsAsync } from './applyPlugins';
import { installExpoPackageAsync } from './installExpoPackage';
import * as Log from '../log';
import { getOperationLog } from '../start/doctor/dependencies/getVersionedPackages';
import { getVersionedDependenciesAsync } from '../start/doctor/dependencies/validateDependenciesVersions';
import { groupBy } from '../utils/array';

/**
 * Given a list of incompatible packages, installs the correct versions of the packages with the package manager used for the project.
 */
export async function fixPackagesAsync(
  projectRoot: string,
  {
    packages,
    packageManager,
    sdkVersion,
    packageManagerArguments,
  }: {
    packages: Awaited<ReturnType<typeof getVersionedDependenciesAsync>>;
    /** Package manager to use when installing the versioned packages. */
    packageManager: PackageManager.NodePackageManager;
    /**
     * SDK to version `packages` for.
     * @example '44.0.0'
     */
    sdkVersion: string;
    /**
     * Extra parameters to pass to the `packageManager` when installing versioned packages.
     * @example ['--no-save']
     */
    packageManagerArguments: string[];
  }
): Promise<void> {
  if (!packages.length) {
    return;
  }

  const { dependencies = [], devDependencies = [] } = groupBy(packages, (dep) => dep.packageType);
  const versioningMessages = getOperationLog({
    othersCount: 0, // All fixable packages are versioned
    nativeModulesCount: packages.length,
    sdkVersion,
  });

  // display all packages to update, including expo package
  Log.log(
    chalk`\u203A Installing ${
      versioningMessages.length ? versioningMessages.join(' and ') + ' ' : ''
    }using {bold ${packageManager.name}}`
  );

  // if updating expo package, install this first, then run expo install --fix again under new version
  const expoDep = dependencies.find((dep) => dep.packageName === 'expo');
  if (expoDep) {
    await installExpoPackageAsync(projectRoot, {
      packageManager,
      packageManagerArguments,
      expoPackageToInstall: `expo@${expoDep.expectedVersionOrRange}`,
      followUpCommandArgs: ['--fix'],
    });
    // follow-up commands will be spawned in a detached process, so return immediately
    return;
  }

  if (dependencies.length) {
    const versionedPackages = dependencies.map(
      (dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`
    );

    await packageManager.addAsync([...packageManagerArguments, ...versionedPackages]);

    await applyPluginsAsync(projectRoot, versionedPackages);
  }

  if (devDependencies.length) {
    await packageManager.addDevAsync([
      ...packageManagerArguments,
      ...devDependencies.map((dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`),
    ]);
  }
}
