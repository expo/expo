import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import Git from '../../Git';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

const { green, cyan, yellow } = chalk;

/**
 * Publishes all packages that have been selected to publish.
 */
export const publishPackages = new Task<TaskArgs>(
  {
    name: 'publishPackages',
    dependsOn: [selectPackagesToPublish],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('\n🚀 Publishing packages...');

    const gitHead = await Git.getHeadCommitHashAsync();

    for (const { pkg, state } of parcels) {
      const packageJsonPath = path.join(pkg.path, 'package.json');

      logger.log(
        '  ',
        `${green(pkg.packageName)} version ${cyan(state.releaseVersion!)} as ${yellow(options.tag)}`
      );

      // Update `gitHead` property so it will be available to read using `npm view --json`.
      // Next publish will depend on this to properly get changes made after that.
      await JsonFile.setAsync(packageJsonPath, 'gitHead', gitHead);

      // Publish the package.
      await Npm.publishPackageAsync(pkg.path, options.tag, options.dry);

      // Delete `gitHead` from `package.json` – no need to clutter it.
      await JsonFile.deleteKeyAsync(packageJsonPath, 'gitHead');

      state.published = true;
    }
  }
);
