import chalk from 'chalk';

import { checkEnvironmentTask } from './checkEnvironmentTask';
import { loadRequestedParcels } from './loadRequestedParcels';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';

/**
 * Checks if the currently logged in user has access to publish packages.
 */
export const checkPackageAccess = new Task<TaskArgs>(
  {
    name: 'checkPackageAccess',
    dependsOn: [
      checkEnvironmentTask, // Checks if the user is logged in to npm.
      loadRequestedParcels,
    ],
  },
  async (parcels: Parcel[]) => {
    // The access token for our CI is not allowing to check the access to packages.
    if (process.env.CI) {
      return;
    }

    return await runWithSpinner(
      'Checking write access to the packages',
      async (step): Promise<any> => {
        const teamPackages = await Npm.getTeamPackagesAsync();
        const packagesWithoutAccess: string[] = [];

        for (const { pkg } of parcels) {
          const packageName = pkg.packageName;

          if (teamPackages[packageName] !== 'read-write') {
            packagesWithoutAccess.push(packageName);
          }
        }

        if (packagesWithoutAccess.length > 0) {
          const formattedPackageNames = packagesWithoutAccess
            .map((pkgName) => chalk.green(pkgName))
            .join(', ');

          step.fail();
          logger.error(
            `You don't have write access to the following packages: ${formattedPackageNames}.`
          );
          logger.error(
            'Ask someone from the team to ensure that you and these packages are added to expo organization.'
          );
          return Task.STOP;
        }
      },
      'Checked that write access is granted'
    );
  }
);
