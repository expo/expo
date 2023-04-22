import { Command } from '@expo/commander';

import * as GitHub from '../GitHub';
import * as Linear from '../Linear';
import logger from '../Logger';

type ActionOptions = {
  issue: string;
};

export default (program: Command) => {
  program
    .command('close-linear-issue-from-github')
    .alias('clifg')
    .description('Close a Linear issue imported from GitHub.')
    .option('-i, --issue <string>', 'Number of the original GitHub issue.')
    .asyncAction(action);
};

async function action(options: ActionOptions) {
  if (isNaN(Number(options.issue))) {
    throw new Error('Flag `--issue` must be provided with a number value');
  }
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Environment variable `GITHUB_TOKEN` is required for this command.');
  }
  if (!process.env.LINEAR_API_KEY) {
    throw new Error('Environment variable `LINEAR_API_KEY` is required for this command.');
  }

  try {
    await closeIssueAsync(+options.issue);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function closeIssueAsync(githubIssueNumber: number) {
  const linearIssues = await Linear.getIssuesAsync({
    teamId: Linear.ENG_TEAM_ID,
    filter: {
      description: {
        containsIgnoreCase: `https://github.com/expo/expo/issues/${githubIssueNumber}`,
      },
      labels: {
        some: {
          name: { eq: 'GitHub' },
        },
      },
    },
  });
  const linearIssue = linearIssues?.[0];

  if (!linearIssue) {
    throw new Error(
      `Unable to find a Linear issue referring to the Github issue #${githubIssueNumber}.`
    );
  }

  await Linear.closeIssueAsync({ issueId: linearIssue.id, teamId: Linear.ENG_TEAM_ID });

  const issueCloserPR = await GitHub.getIssueCloserPrUrlAsync(githubIssueNumber);

  if (issueCloserPR) {
    await Linear.commentIssueAsync({
      issueId: linearIssue.id,
      comment: `This issue was automatically marked as done by ${issueCloserPR}`,
    });
  }
}
