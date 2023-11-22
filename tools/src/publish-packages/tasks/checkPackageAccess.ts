import chalk from 'chalk';

import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';
import { checkEnvironmentTask } from './checkEnvironmentTask';
import { loadRequestedParcels } from './loadRequestedParcels';

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
    return await runWithSpinner(
      'Checking write access to the packages',
      async (step): Promise<any> => {
        const npmUser = await Npm.whoamiAsync();
        const packagesWithoutAccess: string[] = [];

        for (const { pkgView } of parcels) {
          if (npmUser && pkgView && !isPackageMaintainer(pkgView, npmUser)) {
            packagesWithoutAccess.push(pkgView.name);
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

/**
 * Checks whether the user with given name is a maintainer of the package.
 *
 * Package view has a list of maintainers represented as a concatenation of the user name and his email,
 * e.g. `brentvatne <brentvatne@gmail.com>`.
 */
function isPackageMaintainer(pkgView: NonNullable<Npm.PackageViewType>, user: string): boolean {
  return pkgView.maintainers.some((maintainer) => {
    return maintainer.startsWith(user + ' ');
  });
}
