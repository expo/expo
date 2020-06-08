import chalk from 'chalk';

import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { resolveReleaseTypeAndVersion } from './resolveReleaseTypeAndVersion';

const { blue } = chalk;

/**
 * Commits staged changes made by all previous tasks.
 */
export const commitStagedChanges = new Task<TaskArgs>(
  {
    name: 'commitStagedChanges',
    dependsOn: [resolveReleaseTypeAndVersion],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const commitMessage = commitMessageForOptions(options);
    const commitDescription = parcels
      .map(({ pkg, state }) => `${pkg.packageName}@${state.releaseVersion}`)
      .join('\n');

    logger.info(`\n📼 Committing changes with message: ${blue(commitMessage)}`);

    await Git.commitAsync({
      title: commitMessage,
      body: commitDescription,
    });
  }
);

/**
 * If commit message was provided as an option then it's returned.
 * Otherwise it is auto-generated based on provided package names.
 */
function commitMessageForOptions(options: CommandOptions): string {
  if (options.commitMessage) {
    return options.commitMessage;
  }
  if (0 < options.packageNames.length && options.packageNames.length < 4) {
    return `Publish ${options.packageNames.join(', ')}`;
  }
  return 'Publish packages';
}
