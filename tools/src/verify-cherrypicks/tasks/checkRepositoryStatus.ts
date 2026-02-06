import chalk from 'chalk';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { getPullRequests } from './getPullRequests';
import Git from '../../Git';
import { branchNameFromLabel } from '../helpers';

const { cyan } = chalk;

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
    logger.info(`\n🕵️‍♂️  Checking repository status...`);

    if (await Git.hasUnstagedChangesAsync()) {
      logger.error(`🚫 Repository contains unstaged changes, please make sure to have it clear.`);
      logger.error(`🚫 If you want to include them, they must be committed.`);
      return Task.STOP;
    }

    const localBranch = 'main';
    const trackingBranch = await Git.getTrackingBranchNameAsync(localBranch);
    await Git.fetchAsync();
    const stats = await Git.compareBranchesAsync(localBranch, trackingBranch);
    if (stats.ahead + stats.behind > 0) {
      logger.error(`🚫 Your local ${cyan(localBranch)} branch is out of sync with remote branch.`);
      return Task.STOP;
    }

    await Promise.all(
      state.labels.map(async (label): Promise<void | symbol> => {
        const localBranch = branchNameFromLabel(label.name);
        const trackingBranch = await Git.getTrackingBranchNameAsync(localBranch);
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
