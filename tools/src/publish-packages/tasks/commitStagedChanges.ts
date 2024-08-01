import chalk from 'chalk';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { blue } = chalk;

/**
 * Commits staged changes made by all previous tasks.
 */
export const commitStagedChanges = new Task<TaskArgs>(
  {
    name: 'commitStagedChanges',
    dependsOn: [selectPackagesToPublish],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const stagedFiles = await Git.getStagedFilesAsync();

    if (stagedFiles.length === 0) {
      // This may happen if versions have already been updated — manually or by previous publish
      // that failed after committing and pushing to remote. It's safe to just skip this step
      // and use the current head commit as the publish commit.
      logger.info(`\n📼 Nothing to commit — using previous commit as the publish commit`);
      return;
    }

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
