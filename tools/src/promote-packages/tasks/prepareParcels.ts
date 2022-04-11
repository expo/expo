import logger from '../../Logger';
import { getListOfPackagesAsync } from '../../Packages';
import { Task } from '../../TasksRunner';
import { createParcelAsync } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';

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
