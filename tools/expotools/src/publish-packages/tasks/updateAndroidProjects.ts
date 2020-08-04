import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { transformFileAsync } from '../../Utils';
import { Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

const { yellow, magenta } = chalk;

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

      const relativeGradlePath = path.relative(EXPO_DIR, gradlePath);

      logger.log(
        '  ',
        `Updating ${yellow('version')} and ${yellow('versionCode')} in ${magenta(
          relativeGradlePath
        )}`
      );

      await transformFileAsync(gradlePath, [
        {
          // update version and versionName in android/build.gradle
          pattern: /\b(version\s*=\s*|versionName\s+)(['"])(.*?)\2/g,
          replaceWith: `$1$2${state.releaseVersion}$2`,
        },
        {
          pattern: /\bversionCode\s+(\d+)\b/g,
          replaceWith: (match, p1) => {
            const versionCode = parseInt(p1, 10);
            return `versionCode ${versionCode + 1}`;
          },
        },
      ]);
    }
  }
);
