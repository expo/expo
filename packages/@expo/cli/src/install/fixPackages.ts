import { getPackageJson } from '@expo/config';
import type * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';

import * as Log from '../log';
import { getOperationLog } from '../start/doctor/dependencies/getVersionedPackages';
import type { getVersionedDependenciesAsync } from '../start/doctor/dependencies/validateDependenciesVersions';
import { groupBy } from '../utils/array';
import { applyPluginsAsync } from './applyPlugins';
import { installExpoPackageAsync } from './installExpoPackage';
import { updatePnpmCatalogAsync } from './updatePnpmCatalog';

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

  const pkg = getPackageJson(projectRoot);
  const catalogPackages =
    packageManager.name === 'pnpm' && !packageManagerArguments.includes('--no-save')
      ? packages.flatMap((dep) => {
          const spec = pkg[dep.packageType]?.[dep.packageName];
          return spec?.startsWith('catalog:')
            ? [
                {
                  name: dep.packageName,
                  catalog: spec.slice('catalog:'.length),
                  version: dep.expectedVersionOrRange,
                },
              ]
            : [];
        })
      : [];
  const catalogNames = new Set(catalogPackages.map((dep) => dep.name));

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
    if (catalogNames.has('expo')) {
      await updatePnpmCatalogAsync(
        projectRoot,
        catalogPackages.filter((dep) => dep.name === 'expo')
      );
    }
    await installExpoPackageAsync(projectRoot, {
      packageManager,
      packageManagerArguments,
      expoPackageToInstall: `expo@${expoDep.expectedVersionOrRange}`,
      followUpCommandArgs: ['--fix'],
      installFromCatalog: catalogNames.has('expo'),
    });
    // follow-up commands will be spawned in a detached process, so return immediately
    return;
  }

  if (catalogPackages.length) {
    await updatePnpmCatalogAsync(projectRoot, catalogPackages);
    await packageManager.installAsync(packageManagerArguments);
  }

  const regularDependencies = dependencies.filter((dep) => !catalogNames.has(dep.packageName));
  if (regularDependencies.length) {
    await packageManager.addAsync([
      ...packageManagerArguments,
      ...regularDependencies.map((dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`),
    ]);
  }

  if (dependencies.length) {
    await applyPluginsAsync(
      projectRoot,
      dependencies.map((dep) => dep.packageName)
    );
  }

  const regularDevDependencies = devDependencies.filter(
    (dep) => !catalogNames.has(dep.packageName)
  );
  if (regularDevDependencies.length) {
    await packageManager.addDevAsync([
      ...packageManagerArguments,
      ...regularDevDependencies.map((dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`),
    ]);
  }
}
