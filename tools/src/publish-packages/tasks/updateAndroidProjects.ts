import fs from 'fs-extra';
import { styleText } from 'node:util';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { transformFileAsync } from '../../Transforms';
import { Parcel, TaskArgs } from '../types';

/**
 * Updates version props in packages containing Android's native code.
 */
export const updateAndroidProjects = new Task<TaskArgs>(
  {
    name: 'updateAndroidProjects',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/**/android/build.gradle'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n🤖 Updating Android projects...');

    for (const { pkg, state } of parcels) {
      const gradlePath = path.join(pkg.path, 'android/build.gradle');

      // Some packages don't have android code.
      if (!(await fs.pathExists(gradlePath))) {
        continue;
      }

      // skip updating versions in the template project
      if (pkg.packageName === 'expo-module-template') {
        continue;
      }

      const relativeGradlePath = path.relative(EXPO_DIR, gradlePath);

      logger.log(
        '  ',
        `Updating ${styleText('yellow', 'version')} in ${styleText('magenta', relativeGradlePath)}`
      );

      await transformFileAsync(gradlePath, [
        {
          // update version and versionName in android/build.gradle
          find: /\b(version\s*=\s*|versionName\s+)(['"])(.*?)\2/g,
          replaceWith: `$1$2${state.releaseVersion}$2`,
        },
      ]);
    }
  }
);
