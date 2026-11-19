import { Command } from '@expo/commander';

import logger from '../Logger';
import { backportAsync } from '../sdk-cherry-pick/Backport';
import { ghCli } from '../sdk-cherry-pick/GitHub';

/** `LABELS` is a JSON string for a `labeled` event, and a JSON array when the pull request merged. */
function readSdkVersions(env: NodeJS.ProcessEnv): number[] {
  if (env.SDK_VERSION) {
    return [Number(env.SDK_VERSION)];
  }
  const labels: unknown[] = [JSON.parse(env.LABELS || '[]')].flat();
  return labels.flatMap((label) => {
    const match = typeof label === 'string' ? /^sdk-([1-9]\d*)$/.exec(label) : null;
    return match ? [Number(match[1])] : [];
  });
}

async function action() {
  const { env } = process;
  const prNumber = Number(env.PR_NUMBER);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('PR_NUMBER must be the number of a pull request on main, such as 48723.');
  }
  const repo = env.GITHUB_REPOSITORY || 'expo/expo';
  const github = ghCli(repo);
  const pullRequest = await github.viewPullRequestAsync(prNumber);
  const runLogUrl = env.GITHUB_RUN_ID
    ? `${env.GITHUB_SERVER_URL}/${repo}/actions/runs/${env.GITHUB_RUN_ID}`
    : undefined;

  for (const sdkVersion of readSdkVersions(env)) {
    try {
      await backportAsync({
        repoDir: env.REPO_DIR || process.cwd(),
        prNumber,
        sdkVersion,
        ...pullRequest,
        dryRun: env.DRY_RUN !== 'false',
        github,
        runLogUrl,
        log: (message) => logger.log(message),
      });
    } catch (error) {
      logger.error(`The backport to sdk-${sdkVersion} failed:`, error);
      process.exitCode = 1;
    }
  }
}

export default (program: Command) => {
  program
    .command('sdk-cherry-pick')
    .description(
      `Backports a pull request that merged into main to each sdk-NN release branch that its labels name.

  Environment variables:
    PR_NUMBER                       The pull request on main.
    SDK_VERSION                     The NN of sdk-NN. Without it, LABELS names the branches.
    LABELS                          JSON of the label added, or of every label of the pull request.
    DRY_RUN                         "false" pushes and comments. Default: "true".
    REPO_DIR                        A clone with an "origin" remote. Default: the current directory.
    GH_TOKEN                        A token that can push to sdk-NN and comment.`
    )
    .asyncAction(action);
};
