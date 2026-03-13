import chalk from 'chalk';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { formatPullRequest } from '../helpers';
import { TaskArgs } from '../types';
import { getPullRequests } from './getPullRequests';

const { green, bold } = chalk;

/**
 * Print all PRs that needs to be verified.
 */
export const verifyCherrypicks = new Task<TaskArgs>(
  {
    name: 'verifyCherrypicks',
    dependsOn: [getPullRequests],
  },
  async (state, options) => {
    if (state.pullRequests.toVerify.length === 0) {
      logger.info('✅ Did not found any PRs that needs to be to be verified.');
      return;
    }
    logger.info(`\nFound ${state.pullRequests.toVerify.length} entries that needs to be verified:`);
    state.pullRequests.toVerify.forEach((pr) => {
      logger.log(`    ${formatPullRequest(pr)} with ${green(bold(pr.label.name))} tag`);
    });
  }
);
