import { Command } from '@expo/commander';

import logger from '../Logger';
import { reviewPullRequestAsync } from '../code-review';

type ActionOptions = {
  pr: string;
};

async function action(options: ActionOptions) {
  if (isNaN(Number(options.pr))) {
    throw new Error('Flag `--pr` must be provided with a number value.');
  }
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Environment variable `GITHUB_TOKEN` is required for this command.');
  }
  try {
    await reviewPullRequestAsync(+options.pr);
  } catch (error) {
    logger.error(error, error.stack);
    throw error;
  }
}

export default (program: Command) => {
  program
    .command('code-review')
    .alias('review')
    .description('Reviews the pull request.')
    .option('-p, --pr <string>', 'ID of the pull request to review.')
    .asyncAction(action);
};
