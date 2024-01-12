import chalk from 'chalk';

import logger from '../../Logger';
import { packToTarballAsync } from '../../Npm';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';
import { loadRequestedParcels } from './loadRequestedParcels';

/**
 * Runs `npm pack` on each package to prepare tarballs to publish.
 */
export const packPackageToTarball = new Task<TaskArgs>(
  {
    name: 'packPackageToTarball',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[]) => {
    return await runWithSpinner(
      `Packing packages to tarballs`,
      async (step) => {
        try {
          for (const { pkg, state } of parcels) {
            step.start(`Packing ${chalk.green(pkg.packageName)} to tarball`);

            const packResult = await packToTarballAsync(pkg.path);

            state.packageTarballFilename = packResult.filename;
          }
          return;
        } catch (error) {
          step.fail();
          logger.error(error.stderr);
          return Task.STOP;
        }
      },
      `Packed all packages to tarballs`
    );
  }
);
