import chalk from 'chalk';
import semver from 'semver';

import logger from '../Logger';
import * as Npm from '../Npm';
import { Task } from '../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from './types';
import { getListOfPackagesAsync } from '../Packages';
import {
  createParcelAsync,
  promptForPackagesToPromoteAsync,
  printPackagesToPromote,
  formatVersionChange,
} from './helpers';

const { green, yellow, cyan, red } = chalk;

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

    const { exclude, packageNames } = options;
    const allPackages = await getListOfPackagesAsync();
    const filteredPackages = allPackages.filter((pkg) => {
      const isPrivate = pkg.packageJson.private;
      const isIncluded = packageNames.length === 0 || packageNames.includes(pkg.packageName);
      const isExcluded = exclude.includes(pkg.packageName);

      return !isPrivate && isIncluded && !isExcluded;
    });

    parcels.push(...(await Promise.all(filteredPackages.map(createParcelAsync))));
  }
);

/**
 * Finds packages whose local version is not tagged as the target tag provided as a command option (defaults to `latest`).
 */
export const findPackagesToPromote = new Task<TaskArgs>(
  {
    name: 'findPackagesToPromote',
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<symbol | TaskArgs> => {
    logger.info('\n👀 Searching for packages to promote...');

    const newParcels: Parcel[] = [];

    await Promise.all(
      parcels.map(async (parcel) => {
        const { pkg, pkgView, state } = parcel;
        const currentDistTags = await pkg.getDistTagsAsync();
        const versionToReplace = pkgView?.['dist-tags']?.[options.tag] ?? null;
        const canPromote = pkgView && !currentDistTags.includes(options.tag);

        state.distTags = currentDistTags;
        state.versionToReplace = versionToReplace;
        state.isDemoting = !!versionToReplace && semver.lt(pkg.packageVersion, versionToReplace);

        if (canPromote && (!state.isDemoting || options.list || options.demote)) {
          newParcels.push(parcel);
        }
      })
    );

    if (newParcels.length === 0) {
      logger.success('\n✅ No packages to promote.\n');
      return Task.STOP;
    }
    return [newParcels, options];
  }
);

/**
 * Prompts the user to select packages to promote or demote.
 * It's skipped if `--no-select` option is used or it's run on the CI.
 */
export const selectPackagesToPromote = new Task<TaskArgs>(
  {
    name: 'selectPackagesToPromote',
    dependsOn: [findPackagesToPromote],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | TaskArgs> => {
    if (!options.select || process.env.CI) {
      return [parcels, options];
    }

    logger.info('\n👉 Selecting packages to promote...\n');

    const packageNames = await promptForPackagesToPromoteAsync(parcels);
    const newParcels = parcels.filter(({ pkg }) => packageNames.includes(pkg.packageName));

    return [newParcels, options];
  }
);

/**
 * Promotes local versions of selected packages to npm tag passed as an option.
 */
export const promotePackages = new Task<TaskArgs>(
  {
    name: 'promotePackages',
    dependsOn: [prepareParcels, findPackagesToPromote, selectPackagesToPromote],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void> => {
    logger.info(`\n🚀 Promoting packages to ${yellow.bold(options.tag)} tag...`);

    await Promise.all(
      parcels.map(async ({ pkg, state }) => {
        const currentVersion = pkg.packageVersion;
        const { versionToReplace } = state;

        const batch = logger.batch();
        const action = state.isDemoting ? red('Demoting') : green('Promoting');
        batch.log('  ', green.bold(pkg.packageName));
        batch.log(
          '    ',
          action,
          yellow(options.tag),
          formatVersionChange(versionToReplace, currentVersion)
        );

        // Tag the local version of the package.
        if (!options.dry) {
          await Npm.addTagAsync(pkg.packageName, pkg.packageVersion, options.tag);
        }

        // If the local version had any tags assigned, we can drop the old ones.
        if (options.drop && state.distTags && !state.distTags.includes(options.tag)) {
          for (const distTag of state.distTags) {
            batch.log('    ', `Dropping ${yellow(distTag)} tag (${cyan(currentVersion)})...`);

            if (!options.dry) {
              await Npm.removeTagAsync(pkg.packageName, distTag);
            }
          }
        }
        batch.flush();
      })
    );

    logger.success(`\n✅ Successfully promoted ${cyan(parcels.length + '')} packages.`);
  }
);

/**
 * Lists packages that can be promoted to given tag.
 */
export const listPackagesToPromote = new Task<TaskArgs>(
  {
    name: 'listPackagesToPromote',
    dependsOn: [prepareParcels, findPackagesToPromote],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | symbol> => {
    if (parcels.length === 0) {
      logger.success(`\n✅ No packages to promote.\n`);
      return Task.STOP;
    }

    logger.info(`\n📚 Packages to promote to ${yellow.bold(options.tag)}:`);
    printPackagesToPromote(parcels);
  }
);
