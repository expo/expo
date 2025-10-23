import chalk from 'chalk';

import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { pushSdkBranches } from './pushSdkBranches';
import { updateState } from './updateState';
import { verifyCherrypicks } from './verifyCherrypicks';

const { yellow, bold, blue } = chalk;

/**
 * Continues fix cherrypicks after resolving conflicts (without checking repository status).
 */
export const fixCherrypicksContinue = new Task<TaskArgs>(
  {
    name: 'fixCherrypicksContinue',
    dependsOn: [verifyCherrypicks, updateState, pushSdkBranches],
  },
  async (state, options): Promise<void | symbol> => {
    const toCherrypick = [...state.pullRequests.toCherrypick];
    if (toCherrypick.length === 0) {
      logger.info('\n✅ Did not found any PRs that needs to be cherry-picked.');
      return;
    }
    logger.info(`\nCherry-picking ${toCherrypick.length} PRs...`);

    for (const pr of toCherrypick) {
      if (pr.sdkBranch !== (await Git.getCurrentBranchNameAsync())) {
        if (options.dry) {
          logger.log(bold(yellow(`git checkout ${pr.sdkBranch}`)));
        } else {
          logger.debug(`Checking out ${bold(blue(pr.sdkBranch))} branch...`);
          await Git.checkoutAsync({ ref: pr.sdkBranch });
        }
      }
      if (options.dry) {
        logger.log(bold(yellow(`git cherry-pick ${pr.mergeCommit.sha}`)));
      } else {
        logger.debug(`Running ${yellow(`git cherry-pick ${pr.mergeCommit.sha}`)}`);
        try {
          // pipe output to current process stdio to emulate user running this command directly
          await Git.cherryPickAsync([pr.mergeCommit.sha], { inheritStdio: true });
        } catch {
          logger.error(
            `Expotools: could not complete cherry-pick. Resolve the conflicts and continue as instructed by git above.`
          );
          return Task.STOP;
        }
      }
      state.pullRequests.toUpdateLabel.push(pr);
    }
  }
);
