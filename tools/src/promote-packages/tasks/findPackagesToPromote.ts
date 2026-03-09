import semver from 'semver';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Finds packages whose local version is not tagged as the target tag provided as a command option (defaults to `latest`).
 */
export const findPackagesToPromote = new Task<TaskArgs>(
  {
    name: 'findPackagesToPromote',
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<symbol | TaskArgs> => {
    logger.info('\n👀 Searching for packages to promote...');

    const newParcels: Parcel[] = [];

    await Promise.all(
      parcels.map(async (parcel) => {
        const { pkg, pkgView, state } = parcel;
        const currentDistTags = await pkg.getDistTagsAsync();
        const versionToReplace = pkgView?.['dist-tags']?.[options.tag] ?? null;
        const canPromote = pkgView && !currentDistTags.includes(options.tag);

        state.distTags = currentDistTags;
        state.versionToReplace = versionToReplace;
        // A canary version (e.g. 56.0.0-canary-20260212-4f61309) should always be
        // considered less than any non-canary version for promotion purposes.
        const replacingCanary =
          !!versionToReplace &&
          (semver.prerelease(versionToReplace)?.[0] as string)?.startsWith('canary');
        state.isDemoting =
          !!versionToReplace && semver.lt(pkg.packageVersion, versionToReplace) && !replacingCanary;

        if (canPromote && (!state.isDemoting || options.list || options.demote)) {
          newParcels.push(parcel);
        }
      })
    );

    if (newParcels.length === 0) {
      logger.success('\n✅ No packages to promote.\n');
      return Task.STOP;
    }
    return [newParcels, options];
  }
);
