import chalk from 'chalk';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { podInstallAsync } from '../../CocoaPods';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { filterAsync } from '../../Utils';
import * as Workspace from '../../Workspace';
import { Parcel, TaskArgs } from '../types';

const { green } = chalk;

/**
 * Updates pods in Expo client's and bare-expo.
 */
export const updateIosProjects = new Task<TaskArgs>(
  {
    name: 'updateIosProjects',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['apps/*/ios/**'],
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

        // `pod install` sometimes fails, but it's not needed to properly
        // publish packages, so let's just continue if that happens.
        try {
          await podInstallAsync(path.join(nativeApp.path, 'ios'), { noRepoUpdate: true });
        } catch (e) {
          logger.debug(e.stderr || e.stdout);
          logger.error('🍎 Failed to install pods in', green(nativeApp.packageName));
          logger.error('🍎 Please review the output above and fix it once the publish completes');
        }
      })
    );
  }
);
