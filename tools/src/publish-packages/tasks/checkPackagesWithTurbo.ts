import chalk from 'chalk';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runTurboTasksAsync } from '../../Turbo';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { cyan } = chalk;

const PUBLISH_CHECK_TASKS = ['build', 'typecheck', 'depscheck', 'test', 'lint'];

// Runs before the version/workspace rewrites: `depscheck`'s pinned-version check inspects
// dependency ranges, which the pipeline later rewrites (`workspace:*` → concrete versions).
export const checkPackagesWithTurbo = new Task<TaskArgs>(
  {
    name: 'checkPackagesWithTurbo',
    dependsOn: [selectPackagesToPublish],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void> => {
    if (options.skipTurboChecks) {
      logger.warn('⚠️  Skipping Turbo package checks (--skip-turbo-checks).');
      return;
    }

    const packageNames = [...new Set(parcels.map((parcel) => parcel.pkg.packageName))];
    if (packageNames.length === 0) {
      return;
    }

    logger.info(
      `\n🧐 Checking ${cyan(packageNames.length)} package${packageNames.length === 1 ? '' : 's'} with Turbo...`
    );

    await runTurboTasksAsync(PUBLISH_CHECK_TASKS, {
      filters: packageNames,
      continueOnError: true,
    });
  }
);
