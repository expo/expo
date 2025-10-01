import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { getPullRequests } from './getPullRequests';

/**
 * //TODO: Add description.
 */
export const verifyCherrypicks = new Task<TaskArgs>(
  {
    name: 'verifyCherrypicks',
    dependsOn: [getPullRequests],
  },
  async (state, options) => {
    if (state.pullRequestsByLabel.length === 0) {
      logger.info('✅ Did not found any pull requests that needs to be cherry-picked.');
      return;
    }
    state.pullRequestsByLabel.forEach((label) => {
      logger.info(
        `\nFound ${label.pullRequests.length} pull requests that needs to be cherry-picked to ${label.name}:`
      );
      label.pullRequests.forEach((pr) => {
        logger.log(`    #${pr.number} - ${pr.title} (${pr.html_url})`);
      });
    });
  }
);
