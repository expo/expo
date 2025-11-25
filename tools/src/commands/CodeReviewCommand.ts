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
    if (isDiffTooLargeError(error)) {
      // If the diff is too large, we can't do much. It's better not to fail the workflow though.
      logger.info(error.message);
      return;
    }
    logger.error(error, error.stack);
    throw error;
  }
}

/**
 * Checks if the error is a GitHub API error caused by the diff being too large.
 * Currently it's limited to 20000 lines.
 */
function isDiffTooLargeError(error: any) {
  const apiErrors = error.response?.data?.errors ?? [];

  return apiErrors.some((apiError) => {
    return apiError.field === 'diff' && apiError.code === 'too_large';
  });
}

export default (program: Command) => {
  program
    .command('code-review')
    .alias('review')
    .description('Reviews the pull request.')
    .option('-p, --pr <string>', 'ID of the pull request to review.')
    .asyncAction(action);
};
