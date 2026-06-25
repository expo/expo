import JsonFile from '@expo/json-file';
import { styleText } from 'node:util';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Updates `bundledNativeModules.json` file in `expo` package.
 * It's used internally by some `expo-cli` commands so we know which package versions are compatible with `expo` version.
 */
export const updateBundledNativeModulesFile = new Task<TaskArgs>(
  {
    name: 'updateBundledNativeModulesFile',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/expo/bundledNativeModules.json'],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const bundledNativeModulesPath = path.join(EXPO_DIR, 'packages/expo/bundledNativeModules.json');
    const bundledNativeModules =
      await JsonFile.readAsync<Record<string, string>>(bundledNativeModulesPath);

    logger.info(
      `\n✏️  Updating ${styleText(['magenta', 'bold'], 'bundledNativeModules.json')} file...`
    );

    for (const { pkg, state } of parcels) {
      const currentRange = bundledNativeModules[pkg.packageName];
      const rangePrefix = options.canary ? '' : '~';
      const newRange = rangePrefix + state.releaseVersion;

      if (!currentRange) {
        logger.log('  ', styleText('green', pkg.packageName), styleText('gray', 'is not defined.'));
        continue;
      }

      logger.log(
        '  ',
        styleText('green', pkg.packageName),
        `${styleText(['cyan', 'bold'], currentRange)} -> ${styleText(['cyan', 'bold'], newRange)}`
      );

      bundledNativeModules[pkg.packageName] = newRange;
    }

    await JsonFile.writeAsync(bundledNativeModulesPath, bundledNativeModules);
  }
);
