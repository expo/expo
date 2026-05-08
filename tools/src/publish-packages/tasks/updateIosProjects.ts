import chalk from 'chalk';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { podUpdateAsync } from '../../CocoaPods';
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
  async (parcels: Parcel[], options) => {
    // Skip when publishing templates only
    if (options.templatesOnly) {
      return;
    }
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

        // Use `pod update`: we just bumped these pods' versions, and precompiled modules
        // register them as `:podspec =>` sources, which trip CocoaPods' strict version-drift check on
        // `pod install`. `pod update <names>` re-resolves only the bumped
        // pods and is correct in source mode too. Failures are non-fatal.
        try {
          await podUpdateAsync(path.join(nativeApp.path, 'ios'), podspecNames, {
            noRepoUpdate: true,
          });
        } catch (e) {
          logger.debug(e.stderr || e.stdout);
          logger.error('🍎 Failed to install pods in', green(nativeApp.packageName));
          logger.error('🍎 Please review the output above and fix it once the publish completes');
        }
      })
    );
  }
);
