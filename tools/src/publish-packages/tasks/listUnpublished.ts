import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { printPackageParcel } from '../helpers';
import { Parcel, TaskArgs } from '../types';
import { findUnpublished } from './findUnpublished';
import { resolveReleaseTypeAndVersion } from './resolveReleaseTypeAndVersion';

/**
 * Lists packages that have any unpublished changes.
 */
export const listUnpublished = new Task<TaskArgs>(
  {
    name: 'listUnpublished',
    dependsOn: [findUnpublished, resolveReleaseTypeAndVersion],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n🧩 Unpublished packages:');
    parcels.forEach(printPackageParcel);
  }
);
