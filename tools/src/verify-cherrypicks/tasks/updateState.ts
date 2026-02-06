import { formatCommitHash } from '../../Formatter';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { branchNameFromLabel, formatPullRequest, isCherrypicked } from '../helpers';
import { TaskArgs } from '../types';
import { getPullRequests } from './getPullRequests';

/**
 * Updates the state based on cherry-pick status.
 */
export const updateState = new Task<TaskArgs>(
  {
    name: 'updateState',
    dependsOn: [getPullRequests],
  },
  async (state) => {
    if (state.pullRequests.toVerify.length === 0) {
      return;
    }

    const toVerify = [...state.pullRequests.toVerify];
    logger.info(`\nVerifying ${toVerify.length} PRs...`);

    for (const pr of toVerify) {
      const branch = branchNameFromLabel(pr.label.name);
      const alreadyCherrypicked = await isCherrypicked(pr.mergeCommit.sha, branch);

      state.pullRequests.toVerify = state.pullRequests.toVerify.filter(
        (p) => p.number !== pr.number
      );

      if (alreadyCherrypicked) {
        logger.debug(`    ${formatPullRequest(pr)} is already cherry-picked to ${branch}.`);
        state.pullRequests.toUpdateLabel.push(pr);
      } else {
        state.pullRequests.toCherrypick.push(pr);
        logger.debug(
          `    ${formatPullRequest(pr)} needs cherry-pick to ${branch}... ${formatCommitHash(pr.mergeCommit.sha)}`
        );
      }
    }
  }
);
