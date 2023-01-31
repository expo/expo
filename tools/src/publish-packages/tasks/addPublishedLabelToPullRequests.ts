import chalk from 'chalk';
import inquirer from 'inquirer';

import { UNPUBLISHED_VERSION_NAME } from '../../Changelogs';
import { link } from '../../Formatter';
import * as GitHub from '../../GitHub';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

// https://github.com/expo/expo/pulls?q=label:published
const PUBLISHED_LABEL_NAME = 'published';

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
        chalk.magenta('GITHUB_TOKEN')
      );
      return;
    }

    const pullRequestIds: number[] = [];

    // Find all pull requests mentioned in changelogs
    for (const { changelogChanges } of parcels) {
      const versionChanges = changelogChanges.versions[UNPUBLISHED_VERSION_NAME];

      if (!versionChanges) {
        continue;
      }
      for (const entry of Object.values(versionChanges).flat()) {
        const { pullRequests } = entry;
        if (pullRequests && pullRequests.length > 0) {
          pullRequestIds.push(...pullRequests);
        }
      }
    }

    if (pullRequestIds.length === 0) {
      return;
    }
    const pullRequestIdsSet = new Set<number>(pullRequestIds);
    const pullRequestsToLabel: GitHub.PullRequest[] = [];

    logger.info(`\n🐙 List of published pull requests (${pullRequestIdsSet.size}):`);

    // Request and log all published pull requests
    for (const pullRequestId of pullRequestIdsSet) {
      const pr = await GitHub.getPullRequestAsync(pullRequestId, true);

      logger.log(`${linkToPullRequest(pr)}: ${chalk.bold(pr.title)}`);
      pullRequestsToLabel.push(pr);
    }

    // Ask whether to continue adding the label to pull requests logged above
    if (!(await shouldLabelPullRequestsAsync())) {
      return;
    }

    await runWithSpinner('Adding the label...', async (spinner) => {
      // Finally add the label to each pull request
      for (const pullRequest of pullRequestsToLabel) {
        const hasLabel = pullRequest.labels.some((label) => label.name === PUBLISHED_LABEL_NAME);

        if (!hasLabel) {
          await GitHub.addIssueLabelsAsync(pullRequest.number, [PUBLISHED_LABEL_NAME]);
        }
      }
      spinner.succeed('Added the published label');
    });

    logger.log();
  }
);

function linkToPullRequest(pr: GitHub.PullRequest): string {
  return link(chalk.blue('#' + pr.number), pr.html_url);
}

/**
 * Prompts the user whether to add the label to pull requests.
 */
async function shouldLabelPullRequestsAsync(): Promise<boolean> {
  if (process.env.CI) {
    return true;
  }
  const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
    {
      type: 'confirm',
      name: 'proceed',
      prefix: '❔',
      message: chalk.yellow(
        `Do you want to add '${chalk.magenta(PUBLISHED_LABEL_NAME)}' label to these pull requests?`
      ),
      default: true,
    },
  ]);
  return proceed;
}
