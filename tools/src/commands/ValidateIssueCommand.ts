import { Command } from '@expo/commander';

import {
  getIssueAsync,
  listAllOpenIssuesAsync,
  addIssueLabelsAsync,
  removeIssueLabelAsync,
} from '../GitHub';
import logger from '../Logger';

type ActionOptions = {
  issue: string;
};

export default (program: Command) => {
  program
    .command('validate-issue')
    .alias('vi')
    .description('Verifies whether a GitHub issue is valid.')
    .option('-i, --issue <string>', 'Number of the issue to validate.')
    .asyncAction(action);
};

async function action(options: ActionOptions) {
  if (options.issue !== '*' && isNaN(Number(options.issue))) {
    throw new Error('Flag `--issue` must be provided with a number value or *.');
  }
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Environment variable `GITHUB_TOKEN` is required for this command.');
  }
  try {
    if (options.issue === '*') {
      await validateAllOpenIssuesAsync();
    } else {
      await validateIssueAsync(+options.issue);
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

const REPRO_URI_REGEXES = [
  /github\.com/,
  /gitlab\.com/,
  /bitbucket\.org/,
  /snack\.expo\.(dev|io)\//,
];

const SKIP_VALIDATION_LABELS = [
  '!',
  'Issue accepted',
  'invalid issue: feature request',
  'CLI',
  'invalid issue: question',
  'docs',
];

const GITHUB_API_PAGE_SIZE = 10;
async function validateAllOpenIssuesAsync() {
  let issues = await listAllOpenIssuesAsync({
    limit: GITHUB_API_PAGE_SIZE,
    labels: 'needs validation',
  });
  let page = 0;
  while (issues.length >= GITHUB_API_PAGE_SIZE) {
    for (const issue of issues) {
      console.log(issue.title);
      await validateIssueAsync(issue.number);
    }
    issues = await listAllOpenIssuesAsync({
      limit: GITHUB_API_PAGE_SIZE,
      offset: ++page,
      labels: 'needs validation',
    });
  }
}

async function validateIssueAsync(issueNumber: number) {
  const issue = await getIssueAsync(issueNumber);
  if (!issue) {
    throw new Error(`Issue #${issueNumber} does not exist.`);
  }

  // Skip if we already applied some other label
  for (const label of issue.labels) {
    const labelName = typeof label === 'string' ? label : label.name;
    if (labelName && labelName === 'needs validation') {
      // Remove the validation label since we've started validation
      console.log('found needs validation label, removing it.');
      await removeIssueLabelAsync(issueNumber, 'needs validation');
    } else if (labelName && SKIP_VALIDATION_LABELS.includes(labelName)) {
      console.log(`Issue is labeled with ${labelName}, skipping validation.`);
      return;
    }
  }

  // Maybe actually match the full URL and print it?
  const matches = REPRO_URI_REGEXES.map((regex) =>
    (issue.body?.toLowerCase() ?? '').match(regex)
  ).filter(Boolean);

  const includesReproUri = matches.length > 0;

  if (includesReproUri) {
    console.log('Issue includes a reprodible example URI.');
    console.log('adding needs review label.');
    await addIssueLabelsAsync(issueNumber, ['needs review']);
  } else {
    console.log(issue.labels);
    if (issue.labels?.includes('needs review')) {
      console.log('needs review label found, removing it.');
      await removeIssueLabelAsync(issueNumber, 'needs review');
    }
    await addIssueLabelsAsync(issueNumber, ['incomplete issue: missing or invalid repro']);
    console.log('No reproducible example provided, marked for closing.');
  }
}
