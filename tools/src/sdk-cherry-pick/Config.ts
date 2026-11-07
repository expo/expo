import { FatalError } from './Process';

export type SdkCherryPickConfig = {
  prNumber: string;
  sdkVersion: string;
  /** The `owner/name` of the repository on GitHub. */
  repo: string;
  /** A clone of the repository with an `origin` remote. No code from it runs. */
  repoDir: string;
  dryRun: boolean;
  targetBranch: string;
  workBranch: string;
  /** Where prepare records the result for publish. */
  stateDir: string;
  tempRoot: string;
  /** ` [Run log](<url>)` to append to a sentence of a comment, or empty outside GitHub Actions. */
  runLogLink: string;
  /** Only a run that a `pull_request_target` event started comments about the rebuild of `build/`. */
  mayCommentOnRebuild: boolean;
  /** The pull request as the event names it. prepare reads it with `gh pr view` when a value is missing. */
  pullRequest: { mergeSha: string; title: string; author: string };
};

const NUMBER = /^[1-9][0-9]*$/;

/** Reads the configuration from the environment variables that the workflow sets. */
export function loadConfig(env: NodeJS.ProcessEnv): SdkCherryPickConfig {
  const repo = env.REPO || env.GITHUB_REPOSITORY || 'expo/expo';
  const dryRun = env.DRY_RUN || 'true';
  const tempRoot = (env.RUNNER_TEMP || env.TMPDIR || '/tmp').replace(/\/$/, '');
  const prNumber = env.PR_NUMBER ?? '';
  const sdkVersion = env.SDK_VERSION ?? '';

  if (!NUMBER.test(prNumber)) {
    throw new FatalError('PR_NUMBER must be a pull request number, such as 48723.');
  }
  if (!NUMBER.test(sdkVersion)) {
    throw new FatalError('SDK_VERSION must be a number, such as 58.');
  }
  if (dryRun !== 'true' && dryRun !== 'false') {
    throw new FatalError('DRY_RUN must be true or false.');
  }
  if (!env.REPO_DIR) {
    throw new FatalError(`REPO_DIR must name a clone of ${repo}.`);
  }

  const runLogLink = env.GITHUB_RUN_ID
    ? ` [Run log](${env.GITHUB_SERVER_URL || 'https://github.com'}/${repo}/actions/runs/${env.GITHUB_RUN_ID})`
    : '';
  return {
    prNumber,
    sdkVersion,
    repo,
    repoDir: env.REPO_DIR,
    dryRun: dryRun === 'true',
    targetBranch: `sdk-${sdkVersion}`,
    workBranch: `bot/sdk-${sdkVersion}-cherry-pick-${prNumber}`,
    stateDir: env.STATE_DIR || `${tempRoot}/sdk-cherry-pick-${prNumber}-${sdkVersion}`,
    tempRoot,
    runLogLink,
    mayCommentOnRebuild: env.GITHUB_EVENT_NAME === 'pull_request_target',
    pullRequest: {
      mergeSha: env.MERGE_SHA ?? '',
      title: env.PR_TITLE ?? '',
      author: env.PR_AUTHOR ?? '',
    },
  };
}
