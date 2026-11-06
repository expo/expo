import { Command } from '@expo/commander';

import { loadConfig } from '../sdk-cherry-pick/Config';
import { GhCli } from '../sdk-cherry-pick/GitHub';
import { prepareAsync } from '../sdk-cherry-pick/Prepare';
import { createOutput, reportFailureAsync } from '../sdk-cherry-pick/Process';
import { publishAsync } from '../sdk-cherry-pick/Publish';

async function action(step: string | undefined) {
  const output = createOutput(process.env);
  if (step !== 'prepare' && step !== 'publish' && step !== 'run') {
    await output.error('Usage: et sdk-cherry-pick prepare | publish | run');
    process.exitCode = 2;
    return;
  }
  try {
    const config = loadConfig(process.env);
    const dependencies = { github: new GhCli(config.repo, output), output };
    if (step === 'publish') {
      await publishAsync(config, dependencies);
    } else {
      const pullRequest = await prepareAsync(config, dependencies);
      if (step === 'run') {
        await publishAsync(config, dependencies, pullRequest.mergeSha);
      }
    }
  } catch (error) {
    process.exitCode = (await reportFailureAsync(error, output)).status;
  }
}

export default (program: Command) => {
  program
    .command('sdk-cherry-pick [step]')
    .description(
      `Backports a pull request that merged into main to an sdk-NN release branch.

  prepare  Cherry-picks, converts changesets, and records what to publish.
  publish  Pushes the branch, opens the pull request, and comments.
  run      prepare, then publish. For local use.

  prepare and publish are separate steps so that the token that can push is only in the environment of
  publish. prepare reads changesets and other text that a pull request author wrote.

  Both steps read these environment variables:
    PR_NUMBER, SDK_VERSION  Required. The pull request on main, and the NN of sdk-NN.
    REPO_DIR                Required. A clone of the repository with an "origin" remote. prepare fetches
                            into it and adds a temporary worktree. No code from it runs.
    MERGE_SHA, PR_TITLE, PR_AUTHOR
                            Read with "gh pr view" when one of them is missing.
    DRY_RUN                 "true" (default) or "false". A dry run does not push, open a pull request,
                            or comment.
    GH_TOKEN                prepare: a read-only token. publish: a token that can push, open pull
                            requests, and comment.
    REPO                    Default: $GITHUB_REPOSITORY, or expo/expo.
    STATE_DIR               Where prepare records the result for publish.
                            Default: $RUNNER_TEMP or $TMPDIR, then /sdk-cherry-pick-<PR>-<SDK>.`
    )
    .asyncAction(action);
};
