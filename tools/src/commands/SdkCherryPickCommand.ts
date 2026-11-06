import { Command } from '@expo/commander';

import { applyBuildAsync } from '../sdk-cherry-pick/ApplyBuild';
import { loadConfig } from '../sdk-cherry-pick/Config';
import { GhCli } from '../sdk-cherry-pick/GitHub';
import { prepareAsync } from '../sdk-cherry-pick/Prepare';
import { createOutput, FatalError, reportFailureAsync } from '../sdk-cherry-pick/Process';
import { publishAsync } from '../sdk-cherry-pick/Publish';

async function action(step: string | undefined) {
  const output = createOutput(process.env);
  if (step !== 'prepare' && step !== 'publish' && step !== 'run' && step !== 'apply-build') {
    await output.error('Usage: et sdk-cherry-pick prepare | publish | run | apply-build');
    process.exitCode = 2;
    return;
  }
  try {
    const config = loadConfig(process.env);
    const dependencies = { github: new GhCli(config.repo, output), output };
    if (step === 'publish') {
      await publishAsync(config, dependencies);
    } else if (step === 'apply-build') {
      if (!process.env.BUILD_PATCH) {
        throw new FatalError('BUILD_PATCH must name the patch file that the rebuild job uploaded.');
      }
      await applyBuildAsync(config, dependencies, {
        patchFile: process.env.BUILD_PATCH,
        mayComment: config.mayCommentOnRebuild,
      });
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
  apply-build
           Commits the patch of the rebuild job to the backport branch, and pushes it. It checks
           that the patch changes only regular files in the build/ directories that publish
           listed in rebuild-request.json.

  prepare and publish are separate steps so that the token that can push is only in the environment of
  publish. prepare reads changesets and other text that a pull request author wrote.

  Every step reads these environment variables:
    PR_NUMBER, SDK_VERSION  Required. The pull request on main, and the NN of sdk-NN.
    REPO_DIR                Required. A clone of the repository with an "origin" remote. prepare fetches
                            into it and adds a temporary worktree. No code from it runs.
    MERGE_SHA, PR_TITLE, PR_AUTHOR
                            Read with "gh pr view" when one of them is missing.
    DRY_RUN                 "true" (default) or "false". A dry run does not push, open a pull request,
                            or comment.
    GH_TOKEN                prepare: a read-only token. publish and apply-build: a token that can
                            push, open pull requests, and comment.
    REPO                    Default: $GITHUB_REPOSITORY, or expo/expo.
    STATE_DIR               Where prepare records the result for publish.
                            Default: $RUNNER_TEMP or $TMPDIR, then /sdk-cherry-pick-<PR>-<SDK>.
    BUILD_PATCH             apply-build: the patch file of the rebuild job. A missing file means that
                            the rebuild failed.
    GITHUB_EVENT_NAME       publish and apply-build comment about the rebuild on the backport pull
                            request only when it is pull_request_target.`
    )
    .asyncAction(action);
};
