import JsonFile from '@expo/json-file';
import { styleText } from 'node:util';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

/**
 * Updates versions in packages selected to be published.
 */
export const updatePackageVersions = new Task<TaskArgs>(
  {
    name: 'updatePackageVersions',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/**/package.json', 'templates/**/package.json'],
  },
  async (parcels: Parcel[]) => {
    logger.info(`\n🆙 Updating versions in ${styleText(['magenta', 'bold'], 'package.json')}s...`);

    await Promise.all(
      parcels.map(async ({ pkg, state }) => {
        await JsonFile.setAsync(
          path.join(pkg.path, 'package.json'),
          'version',
          state.releaseVersion
        );
        logger.log(
          '  ',
          `${styleText('green', pkg.packageName)}:`,
          `${styleText(['cyan', 'bold'], pkg.packageVersion)} -> ${styleText(['cyan', 'bold'], state.releaseVersion!)}`
        );
      })
    );
  }
);
