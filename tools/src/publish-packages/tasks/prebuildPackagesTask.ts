import chalk from 'chalk';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

import { canPrebuildPackage, prebuildPackageAsync } from '../../prebuilds/Prebuilder';

/**
 * Prebuilds iOS packages that are being distributed with prebuilt binaries.
 */
export const prebuildPackagesTask = new Task<TaskArgs>(
  {
    name: 'prebuildPackagesTask',
    required: true,
    backupable: false,
  },
  async (parcels: Parcel[]) => {
    for (const { pkg } of parcels) {
      if (!canPrebuildPackage(pkg)) {
        continue;
      }
      logger.info('\n👷‍♀️ Prebuilding %s', chalk.green(pkg.packageName));
      await prebuildPackageAsync(pkg);
    }
  }
);
