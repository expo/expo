import chalk from 'chalk';

import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { branchNameFromLabel } from '../helpers';
import { TaskArgs } from '../types';
import { getPullRequests } from './getPullRequests';

const { cyan, bold, yellow } = chalk;

/**
 * Pushes the SDK branches after cherry-picks.
 */
export const pushSdkBranches = new Task<TaskArgs>(
  {
    name: 'pushSdkBranches',
    dependsOn: [getPullRequests],
  },
  async (state, options): Promise<void | symbol> => {
    const labelsToPush = state.labels.filter((label) =>
      state.pullRequests.toUpdateLabel.some((pr) => pr.label.name === label.name)
    );

    if (labelsToPush.length === 0) {
      logger.info('\n✅ Did not found any SDK branches that needs to be pushed.');
      return;
    }

    logger.info(`\nPushing SDK branches...`);

    for (const label of labelsToPush) {
      const localBranch = branchNameFromLabel(label.name);
      const trackingBranch = await Git.getTrackingBranchNameAsync(localBranch);
      const stats = await Git.compareBranchesAsync(localBranch, trackingBranch);

      logger.log(
        `    Branch ${cyan(localBranch)} is ${stats.ahead} commits ahead of remote branch...`
      );
      if (stats.ahead > 0) {
        if (options.dry) {
          logger.log(bold(yellow(`git push ${localBranch}`)));
        } else {
          await Git.pushAsync({
            track: localBranch,
          });
        }
        logger.log(`    Branch ${cyan(localBranch)} pushed to remote.`);
      }
    }
  }
);
