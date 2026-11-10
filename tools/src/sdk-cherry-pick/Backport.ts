import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { GitDirectory } from '../Git';
import { convertChangesetsAsync } from '../changesets/BackportChangelog';
import { isChangesetPath } from '../code-review/Changesets';
import { GitHub } from './GitHub';

export type BackportOptions = {
  /** A clone of the repository with an `origin` remote. */
  repoDir: string;
  prNumber: number;
  sdkVersion: number;
  mergeSha: string;
  title: string;
  author: string;
  /** Logs the pull request and each comment instead of pushing, opening, and commenting. */
  dryRun: boolean;
  github: GitHub;
  runLogUrl?: string;
  log?: (message: string) => void;
};

const MIN_SDK_VERSION = 55;
const BACKPORT_LABEL = 'bot: backport';

const GIT_CONFIG = [
  // The worktree holds the merged change, so a hooks path inside it would run code from that change.
  '-c',
  'core.hooksPath=/dev/null',
  '-c',
  'user.name=Expo Bot',
  '-c',
  'user.email=expo-bot@users.noreply.github.com',
  // Reads the token from the environment, so that it is not written to .git/config.
  '-c',
  'credential.helper=',
  '-c',
  'credential.helper=!f() { echo username=x-access-token; echo "password=$GH_TOKEN"; }; f',
];

function gitIn(dir: string) {
  const repo = new GitDirectory(dir);
  return async (...args: string[]) => (await repo.runAsync([...GIT_CONFIG, ...args])).stdout.trim();
}

/**
 * Cherry-picks the merge commit of a pull request on main onto `sdk-NN` and opens a pull request
 * into that branch. When the bot cannot open it, it comments on the original pull request once.
 */
export async function backportAsync(options: BackportOptions): Promise<void> {
  const { prNumber, sdkVersion, mergeSha, dryRun, github, log = console.log } = options;
  const targetBranch = `sdk-${sdkVersion}`;
  const botBranch = `bot/sdk-${sdkVersion}-cherry-pick-${prNumber}`;
  if (sdkVersion < MIN_SDK_VERSION) {
    log(`The bot backports only to SDK ${MIN_SDK_VERSION} and later, so it skips ${targetBranch}.`);
    return;
  }

  let commented = false;
  const commentAsync = async (body: string) => {
    commented = true;
    if (dryRun) {
      log(`Comment on #${prNumber}:\n${body}`);
    } else {
      await github.commentAsync(prNumber, body);
    }
  };
  const manualSteps = `To backport it by hand:

\`\`\`sh
git fetch origin main ${targetBranch}
git checkout -b ${botBranch} origin/${targetBranch}
git cherry-pick -x ${mergeSha}
\`\`\`

If \`${targetBranch}\` has no \`.changeset/config.json\`, move the summary of each \`.changeset/*.md\` file that this pull request adds into an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the file.`;

  const repo = gitIn(options.repoDir);
  let tempDir: string | undefined;
  try {
    const heads = await repo(
      'ls-remote',
      'origin',
      `refs/heads/${targetBranch}`,
      `refs/heads/${botBranch}`
    );
    const exists = (branch: string) =>
      heads.split('\n').some((line) => line.endsWith(`\trefs/heads/${branch}`));
    if (!exists(targetBranch)) {
      log(`${targetBranch} does not exist, so there is nothing to backport to.`);
      return;
    }
    if (exists(botBranch)) {
      await commentAsync(
        `The branch \`${botBranch}\` already exists, so the bot did not backport this pull request to \`${targetBranch}\`. Delete the branch, then remove the \`${targetBranch}\` label and add it again to retry.`
      );
      return;
    }

    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sdk-cherry-pick-'));
    const worktree = path.join(tempDir, targetBranch);
    const shallow = (await repo('rev-parse', '--is-shallow-repository')) === 'true';
    await repo(
      'fetch',
      '--quiet',
      '--no-tags',
      ...(shallow ? ['--depth=2'] : []),
      'origin',
      mergeSha,
      `+refs/heads/${targetBranch}:refs/remotes/origin/${targetBranch}`
    );
    await repo('worktree', 'add', '--quiet', '--detach', worktree, `origin/${targetBranch}`);
    const git = gitIn(worktree);

    try {
      await git('cherry-pick', '-x', mergeSha);
    } catch (error) {
      if (!(await git('rev-parse', '--quiet', '--verify', 'CHERRY_PICK_HEAD').catch(() => ''))) {
        throw error;
      }
      // A backtick in a file name would end the code block of the comment.
      const conflicts = (await git('diff', '--name-only', '--diff-filter=U')).replace(/`/g, '');
      await git('cherry-pick', '--abort');
      await commentAsync(
        conflicts
          ? `The cherry-pick of ${mergeSha} onto \`${targetBranch}\` has conflicts, so no backport pull request was opened. These files conflict:\n\n\`\`\`\n${conflicts}\n\`\`\`\n\n${manualSteps}`
          : `This change is already on \`${targetBranch}\`: the cherry-pick of ${mergeSha} is empty. No backport was made.`
      );
      return;
    }

    let changesetNote = '';
    if (!fs.existsSync(path.join(worktree, '.changeset/config.json'))) {
      const added = (
        await git(
          'diff-tree',
          '-r',
          '-z',
          '--name-only',
          '--no-commit-id',
          '--diff-filter=A',
          'HEAD'
        )
      )
        .split('\0')
        .filter(isChangesetPath);
      if (added.length > 0) {
        await convertChangesetsAsync(worktree, added, { number: prNumber, author: options.author });
        await git('add', '-A');
        await git(
          'commit',
          '--quiet',
          '-m',
          'Convert changesets to CHANGELOG entries',
          '-m',
          `${targetBranch} does not use changesets. This commit moves the changesets of #${prNumber} into CHANGELOG.md entries.`
        );
        changesetNote = `\n\`${targetBranch}\` does not use changesets, so a second commit moved the changesets of #${prNumber} into \`CHANGELOG.md\` entries. Each entry is in the section for its bump type. Check that the section fits the change.\n`;
      }
    }

    const diffStat = await git('diff', '--stat', `origin/${targetBranch}`, 'HEAD');
    if (!diffStat) {
      await commentAsync(`This change is already on \`${targetBranch}\`. No backport was made.`);
      return;
    }

    // `et check-sdk-prs` reads the first `(#N)` of the subject, so the title must not have one.
    let originalTitle = options.title;
    while (/\(#\d+\)/.test(originalTitle)) {
      originalTitle = originalTitle.replace(/\((#\d+)\)/g, '$1');
    }
    const title = `[${targetBranch}] ${originalTitle} (#${prNumber})`;
    const body = `Backport of #${prNumber} to \`${targetBranch}\`. The bot cherry-picked ${mergeSha} with \`git cherry-pick -x\`.\n${changesetNote}`;
    if (dryRun) {
      log(`Pull request into ${targetBranch}:\n${title}\n\n${body}\n${diffStat}`);
      return;
    }

    await git('push', '--quiet', 'origin', `HEAD:refs/heads/${botBranch}`);
    const number = await github.createPullRequestAsync({
      base: targetBranch,
      head: botBranch,
      title,
      body,
    });
    await github
      .addLabelAsync(number, BACKPORT_LABEL)
      .catch((error) => log(`Could not add the "${BACKPORT_LABEL}" label to #${number}: ${error}`));
    await commentAsync(`Backport PR ${targetBranch}: #${number}`);
  } catch (error) {
    if (!commented) {
      const runLog = options.runLogUrl ? ` [Run log](${options.runLogUrl})` : '';
      await commentAsync(`The backport to \`${targetBranch}\` failed.${runLog}\n\n${manualSteps}`);
    }
    throw error;
  } finally {
    if (tempDir) {
      await repo('worktree', 'remove', '--force', path.join(tempDir, targetBranch)).catch(() => {});
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }
}
