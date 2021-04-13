import { Command } from '@expo/commander';

import { reviewPullRequestAsync } from '../code-review';

type ActionOptions = {
  pr: string;
};

async function action(options: ActionOptions) {
  if (isNaN(+options.pr)) {
    throw new Error('Flag `--pr` must be provided with a number value.');
  }
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Environment variable `GITHUB_TOKEN` is required for this command.');
  }
  await reviewPullRequestAsync(+options.pr);
}

export default (program: Command) => {
  program
    .command('code-review')
    .alias('review')
    .description('Reviews the pull request.')
    .option('-p, --pr <string>', 'ID of the pull request to review.')
    .asyncAction(action);
};
