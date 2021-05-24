import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

import { canPrebuildPackage, cleanFrameworksAsync } from '../../prebuilds/Prebuilder';

/**
 * Cleans up after building prebuilds and publishing them.
 */
export const cleanPrebuildsTask = new Task<TaskArgs>(
  {
    name: 'cleanPrebuildsTask',
  },
  async (parcels: Parcel[]) => {
    logger.log();

    const packagesToClean = parcels.map(({ pkg }) => pkg).filter(canPrebuildPackage);

    if (packagesToClean.length) {
      logger.info('🧹 Cleaning prebuilt resources');
      await cleanFrameworksAsync(packagesToClean);
    }
  }
);
