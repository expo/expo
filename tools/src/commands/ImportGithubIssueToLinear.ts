import { Command } from '@expo/commander';

import * as GitHub from '../GitHub';
import * as Linear from '../Linear';
import logger from '../Logger';

type ActionOptions = {
  issue: string;
};

export default (program: Command) => {
  program
    .command('import-github-issue-to-linear')
    .alias('igitl')
    .description('Import accepted issues from GitHub to Linear.')
    .option('-i, --issue <string>', 'Number of the issue to import.')
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
    await importIssueAsync(+options.issue);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function importIssueAsync(githubIssueNumber: number) {
  const issue = await GitHub.getIssueAsync(githubIssueNumber);
  if (!issue) {
    throw new Error(`Issue #${githubIssueNumber} does not exist.`);
  }

  const githubLabel = await Linear.getOrCreateLabelAsync('GitHub');
  const expoSDKLabel = await Linear.getOrCreateLabelAsync('Expo SDK', Linear.ENG_TEAM_ID);
  const backlogWorkflowState = await Linear.getTeamWorkflowStateAsync(
    'Backlog',
    Linear.ENG_TEAM_ID
  );

  Linear.createIssueAsync({
    title: issue.title,
    labelIds: [githubLabel.id, expoSDKLabel.id],
    stateId: backlogWorkflowState.id,
    description: `### Imported from GitHub: ${issue.html_url}\n---\n${issue.body}
    `,
  });
}
