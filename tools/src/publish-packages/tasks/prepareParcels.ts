import chalk from 'chalk';

import * as Changelogs from '../../Changelogs';
import Git from '../../Git';
import logger from '../../Logger';
import { Package, getListOfPackagesAsync } from '../../Packages';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green } = chalk;

/**
 * Gets a list of public packages in the monorepo, downloads `npm view` result of them,
 * creates their Changelog instance and fills in given parcels array (it's empty at the beginning).
 */
export const prepareParcels = new Task<TaskArgs>(
  {
    name: 'prepareParcels',
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('🔎 Gathering data about packages...');

    const { packageNames } = options;
    const allPackages = await getListOfPackagesAsync();
    const allPackagesObj = allPackages.reduce((acc, pkg) => {
      acc[pkg.packageName] = pkg;
      return acc;
    }, {});

    // Verify that provided package names are valid.
    for (const packageName of packageNames) {
      if (!allPackagesObj[packageName]) {
        throw new Error(`Package with provided name ${green(packageName)} does not exist.`);
      }
    }

    const filteredPackages = allPackages.filter((pkg) => {
      const isPrivate = pkg.packageJson.private;
      const isIncluded = packageNames.length === 0 || packageNames.includes(pkg.packageName);
      return !isPrivate && isIncluded;
    });

    parcels.push(...(await Promise.all(filteredPackages.map(createParcelAsync))));

    if (packageNames.length > 0) {
      // Even if some packages have been explicitly listed as command arguments,
      // we also must take their dependencies into account.

      const parcelsObj = parcels.reduce((acc, parcel) => {
        acc[parcel.pkg.packageName] = parcel;
        return acc;
      }, {});

      await recursivelyResolveDependenciesAsync(allPackagesObj, parcelsObj, parcels);
    }
  }
);

/**
 * Wraps `Package` object into a parcels - convenient wrapper providing more package-related helpers.
 */
export async function createParcelAsync(pkg: Package): Promise<Parcel> {
  const pkgView = await pkg.getPackageViewAsync();
  const changelog = Changelogs.loadFrom(pkg.changelogPath);
  const gitDir = new Git.Directory(pkg.path);

  return {
    pkg,
    pkgView,
    changelog,
    gitDir,
    dependents: [],
    dependencies: [],
    state: {},
  };
}

/**
 * Recursively resolves dependencies for every chosen package.
 */
async function recursivelyResolveDependenciesAsync(
  allPackagesObject: { [key: string]: Package },
  parcelsObject: { [key: string]: Parcel },
  parcels: Parcel[]
): Promise<void> {
  const newParcels: Parcel[] = [];

  for (const parcel of parcels) {
    const dependencies = parcel.pkg.getDependencies().filter((dependency) => {
      return (
        dependency.versionRange !== '*' &&
        allPackagesObject[dependency.name] &&
        !parcelsObject[dependency.name]
      );
    });

    await Promise.all(
      dependencies.map(async ({ name }) => {
        const dependencyPkg = allPackagesObject[name];
        let dependencyParcel = parcelsObject[name];

        // If a parcel for this dependency doesn't exist yet, let's create it.
        if (!dependencyParcel) {
          dependencyParcel = await createParcelAsync(dependencyPkg);
          parcelsObject[name] = dependencyParcel;
          newParcels.push(dependencyParcel);
        }

        dependencyParcel.dependents.push(parcel);
        parcel.dependencies.push(dependencyParcel);
      })
    );
  }

  if (newParcels.length > 0) {
    await recursivelyResolveDependenciesAsync(allPackagesObject, parcelsObject, newParcels);
    parcels.push(...newParcels);
  }
}
