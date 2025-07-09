import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

const { magenta, cyan, green } = chalk;

/**
 * Updates versions in packages selected to be published.
 */
export const updatePackageVersions = new Task<TaskArgs>(
  {
    name: 'updatePackageVersions',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/**/package.json'],
  },
  async (parcels: Parcel[]) => {
    logger.info(`\n🆙 Updating versions in ${magenta.bold('package.json')}s...`);

    await Promise.all(
      parcels.map(async ({ pkg, state }) => {
        await JsonFile.setAsync(
          path.join(pkg.path, 'package.json'),
          'version',
          state.releaseVersion
        );
        logger.log(
          '  ',
          `${green(pkg.packageName)}:`,
          `${cyan.bold(pkg.packageVersion)} -> ${cyan.bold(state.releaseVersion!)}`
        );
      })
    );
  }
);
