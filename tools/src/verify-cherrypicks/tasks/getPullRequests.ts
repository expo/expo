import { getAllMergedPullRequestsByLabelAsync, getAllSdkLabelsAsync } from '../../GitHub';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { branchNameFromLabel } from '../helpers';
import { TaskArgs } from '../types';

/**
 * Fetches all PRs with SDK labels and prepares initial state for further tasks.
 */
export const getPullRequests = new Task<TaskArgs>(
  {
    name: 'getPullRequests',
    dependsOn: [],
  },
  async (state, options): Promise<void | symbol> => {
    let labels = await getAllSdkLabelsAsync();

    if (options.tag) {
      const filteredLabels = labels.filter((label) => label.name === options.tag);
      if (filteredLabels.length === 0) {
        logger.error(`Label with name "${options.tag}" not found.`);
        return Task.STOP;
      }
      labels = filteredLabels;
    }

    state.labels = labels;

    await Promise.all(
      labels.map(async (label) => {
        let pullRequests = await getAllMergedPullRequestsByLabelAsync(label.name);
        if (options.mergedBy) {
          pullRequests = pullRequests.filter((pr) => pr.mergedBy?.login === options.mergedBy);
        }
        pullRequests.forEach((pr) => {
          state.pullRequests.toVerify.push({
            ...pr,
            label,
            sdkBranch: branchNameFromLabel(label.name),
          });
        });
      })
    );
    state.pullRequests.toVerify.sort(
      (a, b) =>
        new Date(a.mergeCommit.committedDate).getTime() -
        new Date(b.mergeCommit.committedDate).getTime()
    );
  }
);
