import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { GitDirectory } from '../Git';
import { spawnErrorOutput } from '../Utils';
import { GitHub } from './GitHub';

export type BackportOptions = {
  /** A clone of the repository with an `origin` remote. */
  repoDir: string;
  prNumber: number;
  sdkVersion: number;
  mergeSha: string;
  /** The branch that the pull request merged into. The bot backports only from `main`. */
  baseBranch: string;
  /** Logs the commit that it would push and each comment, instead of pushing and commenting. */
  dryRun: boolean;
  github: GitHub;
  runLogUrl?: string;
  log?: (message: string) => void;
};

const MIN_SDK_VERSION = 55;
const MAX_PUSH_ATTEMPTS = 3;

const GIT_CONFIG = [
  // The worktree holds the merged change, so a hooks path inside it would run code from that change.
  '-c',
  'core.hooksPath=/dev/null',
  '-c',
  'user.name=Expo Bot',
  '-c',
  'user.email=34669131+expo-bot@users.noreply.github.com',
  '-c',
  'credential.helper=',
];

// The environment keeps the token out of .git/config and out of the command line, which spawn errors print.
function gitAuthEnv(): NodeJS.ProcessEnv {
  const token = process.env.GH_TOKEN;
  if (!token) {
    return process.env;
  }
  return {
    ...process.env,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basicAuth(token)}`,
  };
}

function basicAuth(token: string): string {
  return Buffer.from(`x-access-token:${token}`).toString('base64');
}

// GitHub Actions masks the token in the run log, but not in a comment.
function redactToken(text: string): string {
  const token = process.env.GH_TOKEN;
  return token ? text.replaceAll(token, '***').replaceAll(basicAuth(token), '***') : text;
}

function gitIn(dir: string) {
  const repo = new GitDirectory(dir);
  return async (...args: string[]) => {
    try {
      return (await repo.runAsync([...GIT_CONFIG, ...args], { env: gitAuthEnv() })).stdout.trim();
    } catch (error) {
      const output = spawnErrorOutput(error);
      if (error instanceof Error && output) {
        error.message += `\n${output}`;
      }
      throw error;
    }
  };
}

/**
 * Cherry-picks the merge commit of a pull request on main onto `sdk-NN` and pushes it to that
 * branch. When the bot cannot push it, it comments the manual steps on the original pull request once.
 */
export async function backportAsync(options: BackportOptions): Promise<void> {
  const { prNumber, sdkVersion, mergeSha, dryRun, github, log = console.log } = options;
  const targetBranch = `sdk-${sdkVersion}`;
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
  const runLog = options.runLogUrl ? ` [Run log](${options.runLogUrl})` : '';
  const manualSteps = `To backport it by hand:

\`\`\`sh
git fetch origin ${targetBranch}
git checkout ${targetBranch}
git pull --ff-only origin ${targetBranch}
git cherry-pick -x ${mergeSha}
git push origin ${targetBranch}
\`\`\``;

  const repo = gitIn(options.repoDir);
  let tempDir: string | undefined;
  try {
    if (!(await repo('ls-remote', 'origin', `refs/heads/${targetBranch}`))) {
      log(`${targetBranch} does not exist, so there is nothing to backport to.`);
      return;
    }
    if (options.baseBranch !== 'main') {
      const reason = `The bot backports only pull requests that merged into \`main\`. This pull request merged into \`${options.baseBranch}\`, so the bot did not backport it to \`${targetBranch}\`.`;
      await commentAsync(`${reason}\n\n${manualSteps}`);
      throw new Error(reason);
    }

    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sdk-cherry-pick-'));
    const worktree = path.join(tempDir, targetBranch);
    const shallow = (await repo('rev-parse', '--is-shallow-repository')) === 'true';
    const fetchTargetAsync = async () => {
      await repo(
        'fetch',
        '--quiet',
        '--no-tags',
        ...(shallow ? ['--depth=2'] : []),
        'origin',
        mergeSha,
        `+refs/heads/${targetBranch}:refs/remotes/origin/${targetBranch}`
      );
      return repo('rev-parse', `refs/remotes/origin/${targetBranch}`);
    };
    let base = await fetchTargetAsync();
    await repo('worktree', 'add', '--quiet', '--detach', worktree, base);
    const git = gitIn(worktree);

    for (let attempt = 1; ; attempt++) {
      if (!fs.existsSync(path.join(worktree, '.changeset/config.json'))) {
        const reason = `\`${targetBranch}\` has no \`.changeset/config.json\`, so the bot did not backport this pull request. On that branch, a person must turn the changesets into \`CHANGELOG.md\` entries and rebuild the \`build/\` output.`;
        await commentAsync(
          `${reason}\n\n${manualSteps}\n\nBefore \`git push\`, move the summary of each \`.changeset/*.md\` file that this pull request adds into an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the file. Then rebuild the \`build/\` output of each package that the change touches, and commit the result.`
        );
        throw new Error(reason);
      }

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
            ? `The cherry-pick of ${mergeSha} onto \`${targetBranch}\` has conflicts, so the bot did not backport it. These files conflict:\n\n\`\`\`\n${conflicts}\n\`\`\`\n\n${manualSteps}`
            : `This change is already on \`${targetBranch}\`: the cherry-pick of ${mergeSha} is empty. No backport was made.`
        );
        return;
      }

      if (dryRun) {
        log(
          `Would push to ${targetBranch}:\n${await git('show', '--stat', '--format=%s%n', 'HEAD')}`
        );
        return;
      }

      try {
        await git('push', '--quiet', 'origin', `HEAD:refs/heads/${targetBranch}`);
        break;
      } catch (error) {
        const head = await git('rev-parse', 'HEAD');
        const pushedOnto = base;
        base = await fetchTargetAsync();
        // The remote took the push, but git lost its reply.
        if (base === head) {
          break;
        }
        // An unchanged tip means the remote refused the commit itself, so a retry would fail the same way.
        if (base === pushedOnto) {
          // A backtick in the output would end the code block of the comment.
          const output = redactToken(spawnErrorOutput(error)).replace(/`/g, "'");
          await commentAsync(
            `The bot could not push the backport to \`${targetBranch}\`, so a person must push it.${runLog} Git printed:\n\n\`\`\`\n${output}\n\`\`\`\n\n${manualSteps}`
          );
          throw error;
        }
        if (attempt === MAX_PUSH_ATTEMPTS) {
          const reason = `\`${targetBranch}\` moved before each of ${MAX_PUSH_ATTEMPTS} pushes, so the bot did not backport this pull request. A person must push it.`;
          await commentAsync(`${reason}${runLog}\n\n${manualSteps}`);
          throw new Error(reason);
        }
        log(`${targetBranch} moved during push attempt ${attempt}, so the bot cherry-picks again.`);
        await git('reset', '--quiet', '--hard', base);
      }
    }

    await commentAsync(`Backported to \`${targetBranch}\` as ${await git('rev-parse', 'HEAD')}`);
  } catch (error) {
    if (!commented) {
      await commentAsync(`The backport to \`${targetBranch}\` failed.${runLog}\n\n${manualSteps}`);
    }
    throw error;
  } finally {
    if (tempDir) {
      await repo('worktree', 'remove', '--force', path.join(tempDir, targetBranch)).catch(() => {});
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      await repo('worktree', 'prune').catch(() => {});
    }
  }
}
