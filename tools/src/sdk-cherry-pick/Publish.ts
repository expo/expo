import { SdkCherryPickConfig } from './Config';
import { GitHubClient } from './GitHub';
import { Cli, FatalError, Output, reportFailureAsync } from './Process';
import { BUNDLE_REF, isStringArray, RebuildRequest, StateDir } from './State';
import { manualSteps, rebuildFailedComment } from './Text';

// The token stays in the environment. It is not in .git/config or on a command line: git expands
// $GH_TOKEN in the shell that runs the helper.
export const CREDENTIAL_HELPER =
  'credential.helper=!f() { echo username=x-access-token; echo "password=$GH_TOKEN"; }; f';

/** Finds every backport the bot opened: `is:pr label:"bot: backport" base:sdk-NN`. */
export const BACKPORT_LABEL = 'bot: backport';

export type PublishDependencies = { github: GitHubClient; output: Output };

function indent(text: string): string {
  return text === ''
    ? ''
    : text
        .split(/(?<=\n)/)
        .map((line) => `    ${line}`)
        .join('');
}

/**
 * Pushes the branch, opens the pull request, and comments, as prepare recorded. It is the only step
 * with a token that can write. `mergeSha` is the merge commit that the event or prepare named, or
 * empty for a manual run.
 *
 * When it fails, it still tells the author, but only when prepare read the pull request as merged
 * into main, or when the merge commit came from the event of a pull request that merged into main.
 * A manual run can name any pull request.
 */
export async function publishAsync(
  config: SdkCherryPickConfig,
  dependencies: PublishDependencies,
  mergeSha: string = config.pullRequest.mergeSha
): Promise<void> {
  // Without this file, the workflow comments for publish: it could not start, so it cannot comment.
  await new StateDir(config.stateDir).markAsync('publish-started');
  const publisher = new Publisher(config, dependencies, mergeSha);
  try {
    await publisher.publishAsync();
  } catch (error) {
    const exit = await reportFailureAsync(error, dependencies.output);
    if (publisher.mayCommentOnFailure()) {
      await publisher.commentOnFailureAsync().catch(() => {});
    }
    throw exit;
  }
}

class Publisher {
  private readonly state: StateDir;
  private readonly git: Cli;
  /** Each run comments at most once. A failed `gh pr comment` can still have posted. */
  private commented = false;
  private branchOnRemote = false;

  constructor(
    private readonly config: SdkCherryPickConfig,
    private readonly dependencies: PublishDependencies,
    private readonly mergeSha: string
  ) {
    this.state = new StateDir(config.stateDir);
    this.git = new Cli('git', ['-C', config.repoDir]);
  }

  async publishAsync(): Promise<void> {
    const { output } = this.dependencies;
    if (this.config.dryRun) {
      await output.log('Dry run: nothing is pushed, opened, or commented.');
    }
    switch (await this.state.readIfExistsAsync('outcome')) {
      case 'open-pr':
        return this.openBackportAsync({ push: true });
      case 'open-pr-from-branch':
        this.branchOnRemote = true;
        return this.openBackportAsync({ push: false });
      case 'comment':
        return this.commentAsync(await this.state.readIfExistsAsync('comment.md'));
      case 'skip':
        return output.log('Nothing to publish. The prepare step says why.');
      default:
        throw new FatalError('prepare did not record an outcome.');
    }
  }

  mayCommentOnFailure(): boolean {
    return !this.commented && (this.state.exists('pull-request-loaded') || this.mergeSha !== '');
  }

  async commentOnFailureAsync(): Promise<void> {
    const { targetBranch, workBranch, runLogLink } = this.config;
    await this.commentAsync(
      this.branchOnRemote
        ? `The \`${workBranch}\` branch is on GitHub, but the bot could not open the backport pull request into \`${targetBranch}\`.${runLogLink} Re-run the failed jobs of the workflow run. The new run opens the pull request from that branch.`
        : `The backport to \`${targetBranch}\` failed before it could finish, so no backport pull request was opened.${runLogLink}\n\n${manualSteps(this.config, this.mergeSha, 'unknown')}`
    );
  }

  /** With `push`, pushes the prepared commit first. Without it, the branch already exists. */
  private async openBackportAsync({ push }: { push: boolean }): Promise<void> {
    const { config, git, state } = this;
    const { github, output } = this.dependencies;
    const title = await state.readAsync('title');
    const commit = push ? await state.readAsync('commit') : '';
    const targetTip = push ? await state.readAsync('target-tip') : '';

    if (config.dryRun) {
      let branch = `Branch: ${config.workBranch}, which exists already. It is not pushed again.\n`;
      if (push) {
        const commits = await git.runAsync(['log', '--oneline', `${targetTip}..${commit}`]);
        const diffStat = await git.runAsync(['diff', '--stat', targetTip, commit]);
        branch = `Branch: ${config.workBranch}\nCommits:\n${commits.stdout}Diff summary:\n${diffStat.stdout}`;
      }
      const body = indent(await state.readRawAsync('body.md'));
      await output.untrusted(
        `${branch}Pull request into ${config.targetBranch}:\n  Title: ${title}\n  Label: ${BACKPORT_LABEL}\n  Body:\n${body}`
      );
      await this.commentAsync(`Backport PR ${config.targetBranch}: #<pull request number>`);
      if (push) {
        await this.recordRebuildRequestAsync({ commit, targetTip, pullRequest: '' });
      }
      return;
    }

    if (push) {
      await git.runAsync(
        [
          '-c',
          'credential.helper=',
          '-c',
          CREDENTIAL_HELPER,
          'push',
          '--quiet',
          `https://github.com/${config.repo}.git`,
          `${commit}:refs/heads/${config.workBranch}`,
        ],
        { stdout: 'inherit' }
      );
    }
    this.branchOnRemote = true;
    const url = await github.createPullRequestAsync({
      base: config.targetBranch,
      head: config.workBranch,
      title,
      bodyFile: state.path('body.md'),
    });
    const number = url.match(/\/pull\/(\d+)$/)?.[1];
    const reference = number ? `#${number}` : url;
    // The label only helps people find backports. Without it, the pull request is still complete.
    await github
      .addLabelAsync(number ?? url, BACKPORT_LABEL)
      .catch(() =>
        output.log(
          `The bot could not add the \`${BACKPORT_LABEL}\` label to ${reference}. Add it by hand.`
        )
      );
    await this.commentAsync(`Backport PR ${config.targetBranch}: ${reference}`);
    // After the comment, so that a failure here cannot post the comment that no pull request was opened.
    if (push) {
      await this.recordRebuildRequestAsync({ commit, targetTip, pullRequest: number ?? '' }).catch(
        async (error) => {
          // Without a request, the rebuild jobs skip, and so does the comment of push-build.
          if (number && config.mayCommentOnRebuild) {
            await github
              .commentAsync(number, rebuildFailedComment(config, 'rebuild'))
              .catch(() => {});
          }
          throw error;
        }
      );
    }
  }

  /**
   * Records what the rebuild jobs of the workflow need, when prepare listed `build/` directories.
   * The commit goes in a bundle, because a dry run pushes it nowhere.
   */
  private async recordRebuildRequestAsync(request: Omit<RebuildRequest, 'dirs'>): Promise<void> {
    const dirs = JSON.parse((await this.state.readIfExistsAsync('build-dirs')) || '[]');
    if (!isStringArray(dirs)) {
      throw new FatalError('prepare recorded build-dirs that are not a list of directories.');
    }
    if (dirs.length === 0) {
      return;
    }
    await this.git.runAsync(['update-ref', BUNDLE_REF, request.commit]);
    try {
      await this.git.runAsync([
        'bundle',
        'create',
        '-q',
        this.state.path('rebuild.bundle'),
        BUNDLE_REF,
        `^${request.targetTip}`,
      ]);
    } finally {
      await this.git.tryAsync(['update-ref', '-d', BUNDLE_REF]);
    }
    await this.state.writeAsync(
      'rebuild-request.json',
      `${JSON.stringify({ ...request, dirs } satisfies RebuildRequest)}\n`
    );
  }

  private async commentAsync(body: string): Promise<void> {
    const { github, output } = this.dependencies;
    this.commented = true;
    if (this.config.dryRun) {
      await output.log(`Comment on #${this.config.prNumber}:`);
      await output.untrusted(`${body}\n`);
    } else {
      await github.commentAsync(this.config.prNumber, body);
    }
  }
}
