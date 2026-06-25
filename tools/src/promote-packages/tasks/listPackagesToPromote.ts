import { styleText } from 'node:util';

import { findPackagesToPromote } from './findPackagesToPromote';
import { prepareParcels } from './prepareParcels';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { printPackagesToPromote } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';

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

    logger.info(`\n📚 Packages to promote to ${styleText(['yellow', 'bold'], options.tag)}:`);
    printPackagesToPromote(parcels);
  }
);
