import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { isParcelUnpublished, printPackageParcel } from '../helpers';
import { Parcel, TaskArgs } from '../types';
import { loadRequestedParcels } from './loadRequestedParcels';

/**
 * Lists packages that have any unpublished changes.
 */
export const listUnpublished = new Task<TaskArgs>(
  {
    name: 'listUnpublished',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n🧩 Unpublished packages:');

    parcels.filter((parcel) => isParcelUnpublished(parcel)).forEach(printPackageParcel);
  }
);
