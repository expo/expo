import chalk from 'chalk';
import path from 'path';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { spawnAsync, filterAsync } from '../../Utils';
import * as Workspace from '../../Workspace';
import { Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

const { green } = chalk;

/**
 * Updates pods in Expo client's and bare-expo.
 */
export const updateIosProjects = new Task<TaskArgs>(
  {
    name: 'updateIosProjects',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['ios', 'apps/*/ios/**'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n🍎 Updating iOS projects...');

    const nativeApps = Workspace.getNativeApps();

    await Promise.all(
      nativeApps.map(async (nativeApp) => {
        const localPods = await filterAsync(parcels, (parcel) => {
          const { podspecName } = parcel.pkg;
          return !!podspecName && nativeApp.hasLocalPodDependencyAsync(podspecName);
        });
        const podspecNames = localPods
          .map((parcel) => parcel.pkg.podspecName)
          .filter(Boolean) as string[];

        if (podspecNames.length === 0) {
          logger.log('  ', `${green(nativeApp.packageName)}: No pods to update.`);
          return;
        }

        logger.log('  ', `${green(nativeApp.packageName)}: Reinstalling pods...`);

        await spawnAsync('pod', ['install', '--no-repo-update'], {
          cwd: path.join(nativeApp.path, 'ios'),
        });
      })
    );
  }
);
