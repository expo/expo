import chalk from 'chalk';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { getPullRequests } from './getPullRequests';
import Git from '../../Git';

const { cyan, blue } = chalk;

/**
 * Checks whether the current branch is correct and working dir is not dirty.
 */
export const checkRepositoryStatus = new Task<TaskArgs>(
  {
    name: 'checkRepositoryStatus',
    required: true,
    dependsOn: [getPullRequests],
  },
  async (state, options): Promise<void | symbol> => {
    logger.info(`\n🕵️‍♂️ Checking repository status...`);

    // if (await Git.hasUnstagedChangesAsync()) {
    //   logger.error(`🚫 Repository contains unstaged changes, please make sure to have it clear.`);
    //   logger.error(`🚫 If you want to include them, they must be committed.`);
    //   return Task.STOP;
    // }

    await Promise.all(
      state.pullRequestsByLabel.map(async (label): Promise<void | symbol> => {
        const localBranch = getSdkBranchFromLabel(label.name);
        const trackingBranch = await Git.getTrackingBranchNameAsync(localBranch);
        await Git.fetchAsync();
        const stats = await Git.compareBranchesAsync(localBranch, trackingBranch);
        if (stats.ahead > 0 || (!options.continue && stats.behind > 0)) {
          logger.error(
            `🚫 Your local branch ${cyan(localBranch)} is out of sync with remote branch.`
          );
          return Task.STOP;
        }
      })
    );
  }
);

/**
 * Returns SDK branch name (sdk-<version>) based on the label name (SDK <version>).
 */
function getSdkBranchFromLabel(label: string) {
  return `sdk-${label.split(' ')[1]}`;
}
