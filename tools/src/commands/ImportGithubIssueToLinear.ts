import { Command } from '@expo/commander';
import { User as LinearUser } from '@linear/sdk';
import { UserFilter } from '@linear/sdk/dist/_generated_documents';

import * as GitHub from '../GitHub';
import * as Linear from '../Linear';
import logger from '../Logger';
import * as OpenAI from '../OpenAI';

type ActionOptions = {
  issue: string;
  importer?: string;
};

export default (program: Command) => {
  program
    .command('import-github-issue-to-linear')
    .alias('igitl')
    .description('Import accepted issues from GitHub to Linear.')
    .option('-i, --issue <string>', 'Number of the issue to import.')
    .option(
      '-imp, --importer [string]',
      '[optional] The username of GitHub account that is importing the issue.'
    )
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
    await importIssueAsync(+options.issue, options.importer);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function importIssueAsync(githubIssueNumber: number, importer?: string) {
  const issue = await GitHub.getIssueAsync(githubIssueNumber);
  if (!issue) {
    throw new Error(`Issue #${githubIssueNumber} does not exist.`);
  }

  let issueSummary: string | undefined;

  try {
    issueSummary = await OpenAI.askChatGPTAsync(
      `Provide a brief summary of the following GitHub issue on the Expo repository in 3 to 5 bullet points, ignoring the environment section. Keep in mind that this is the user's perspective, and any judgement they share around priority may not match the opinion of maintainers. This summary will be read by the Expo project maintainers.\n${issue.body}`
    );
  } catch (error) {
    logger.warn('Failed to generate issue summary using OpenAI. Skipping...');
    logger.debug(`OpenAI askChatGPTAsync error: ${error}`);
  }

  let issueDescription = `### This issue was automatically imported from GitHub: ${issue.html_url}\n`;

  let importerLinearUser: LinearUser | undefined;
  if (importer && (importerLinearUser = await inferLinearUserId([importer]))) {
    issueDescription += `#### Issue accepted by @${importerLinearUser.displayName}\n`;
  }
  if (issueSummary) {
    issueDescription += `---\n## Summary:\n${issueSummary}`;
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
    description: issueDescription,
    assigneeId: (await inferLinearUserId(issue.assignees?.map(({ login }) => login)))?.id,
    subscriberIds: importerLinearUser?.id ? [importerLinearUser.id] : undefined,
  });
}

async function inferLinearUserId(githubUsernames?: string[]): Promise<LinearUser | undefined> {
  if (!githubUsernames?.length) {
    return undefined;
  }

  const githubUsers = await Promise.all(
    githubUsernames.map(async (u) => await GitHub.getUserAsync(u))
  );

  const linearUsers = await Linear.getTeamMembersAsync({
    teamId: Linear.ENG_TEAM_ID,
    filter: {
      or: githubUsers.reduce((acc: UserFilter[], cur) => {
        acc.push({ displayName: { eqIgnoreCase: cur.login } });
        if (cur.name) {
          acc.push({ name: { containsIgnoreCase: cur.name } });
        }
        if (cur.email) {
          acc.push({ email: { eq: cur.email } });
        }

        return acc;
      }, []),
    },
  });

  return linearUsers?.[0];
}
