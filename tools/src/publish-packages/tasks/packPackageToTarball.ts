import chalk from 'chalk';

import { loadRequestedParcels } from './loadRequestedParcels';
import logger from '../../Logger';
import { packToTarballAsync } from '../../Npm';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';

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
          // eslint-disable-next-line no-useless-return
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
