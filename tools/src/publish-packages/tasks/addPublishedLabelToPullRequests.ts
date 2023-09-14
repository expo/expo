import chalk from 'chalk';
import inquirer from 'inquirer';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { UNPUBLISHED_VERSION_NAME } from '../../Changelogs';
import { link } from '../../Formatter';
import * as GitHub from '../../GitHub';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';

// https://github.com/expo/expo/pulls?q=label:published
const PUBLISHED_LABEL_NAME = 'published';

const { green, blue, magenta, bold } = chalk;

/**
 * Adds "published" label to pull requests mentioned in changelog entries.
 */
export const addPublishedLabelToPullRequests = new Task<TaskArgs>(
  {
    name: 'addPublishedLabelToPullRequests',
    dependsOn: [selectPackagesToPublish],
  },
  async (parcels: Parcel[]) => {
    if (!process.env.GITHUB_TOKEN) {
      logger.error(
        'Environment variable `%s` must be set to add labels to pull requests',
        magenta('GITHUB_TOKEN')
      );
      return;
    }

    // A set of pull request IDs extracted from changelog entries
    const pullRequestIds = new Set<number>();

    // Find all pull requests mentioned in changelogs
    for (const { changelogChanges } of parcels) {
      const versionChanges = changelogChanges.versions[UNPUBLISHED_VERSION_NAME];

      if (!versionChanges) {
        continue;
      }
      for (const entry of Object.values(versionChanges).flat()) {
        entry.pullRequests?.forEach((pullRequestId) => {
          pullRequestIds.add(pullRequestId);
        });
      }
    }

    if (pullRequestIds.size === 0) {
      return;
    }

    // Request for pull request objects for the extracted IDs
    // This needs to happen consecutively to reduce the risk of being rate-limited by GitHub
    const pullRequests = await runWithSpinner(
      'Requesting published pull requests from GitHub',
      async () => {
        const pullRequests: GitHub.PullRequest[] = [];

        for (const pullRequestId of pullRequestIds) {
          const pullRequest = await GitHub.getPullRequestAsync(pullRequestId, true);
          const hasLabel = pullRequest.labels.some((label) => label.name === PUBLISHED_LABEL_NAME);

          if (!hasLabel) {
            pullRequests.push(pullRequest);
          }
        }
        return pullRequests;
      },
      'Loaded published pull requests from GitHub'
    );

    // Skip the rest if all pull requests already have the label
    if (pullRequests.length === 0) {
      logger.log('There are no pull requests that are not labeled already');
      return;
    }

    // Select pull requests to mark as published
    const pullRequestsToLabel = await selectPullRequestsToLabel(pullRequests);

    // Finally, consecutively add the label to each pull request
    await runWithSpinner(
      'Adding the label to selected pull requests',
      async () => {
        for (const pullRequest of pullRequestsToLabel) {
          await GitHub.addIssueLabelsAsync(pullRequest.number, [PUBLISHED_LABEL_NAME]);
        }
      },
      'Added the published label'
    );

    logger.log();
  }
);

function linkToPullRequest(pr: GitHub.PullRequest): string {
  return link(blue('#' + pr.number), pr.html_url);
}

function linkToAuthor(pr: GitHub.PullRequest): string {
  const { user } = pr;
  return user ? link(green('@' + user.login), user.html_url) : 'anonymous';
}

function formatPullRequest(pr: GitHub.PullRequest): string {
  return `${linkToPullRequest(pr)}: ${bold(pr.title)} (by ${linkToAuthor(pr)})`;
}

/**
 * Prompts the user to select pull requests that should be labeled as published.
 */
async function selectPullRequestsToLabel(
  pullRequests: GitHub.PullRequest[]
): Promise<GitHub.PullRequest[]> {
  const { selectedPullRequests } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedPullRequests',
      message: 'Which pull requests do you want to label as published?\n',
      choices: pullRequests.map((pr) => {
        return {
          name: formatPullRequest(pr),
          value: pr,
          checked: true,
        };
      }),
    },
  ]);
  return selectedPullRequests as GitHub.PullRequest[];
}
