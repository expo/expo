import { getAllSdkLabelsAsync, getPullRequestsByLabelAsync } from '../../GitHub';
import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';

/**
 * //TODO: Add description.
 */
export const getPullRequests = new Task<TaskArgs>(
  {
    name: 'getPullRequests',
    dependsOn: [],
  },
  async (state, options) => {
    const labels = await getAllSdkLabelsAsync();
    await Promise.all(
      labels.map(async (label) => {
        const pullRequests = await getPullRequestsByLabelAsync(label.name);
        if (pullRequests.length > 0) {
          state.pullRequestsByLabel.push({
            ...label,
            pullRequests,
          });
        }
      })
    );
  }
);
