import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { GitDirectory } from '../Git';
import { spawnErrorOutput } from '../Utils';
import { convertChangesetsAsync } from '../changesets/BackportChangelog';
import { isChangesetPath } from '../code-review/Changesets';
import { GitHub } from './GitHub';

export type BackportOptions = {
  /** A clone of the repository with an `origin` remote. */
  repoDir: string;
  prNumber: number;
  sdkVersion: number;
  mergeSha: string;
  /** The branch that the pull request merged into. The bot backports only from `main`. */
  baseBranch: string;
  /** The login of the pull request author, whom the `CHANGELOG.md` entries credit. */
  author: string;
  /**
   * For a branch without changesets: the checked patch of the `build/` folders that the workflow
   * rebuilt for this backport. A missing file means that the rebuild failed.
   */
  buildPatch?: string;
  /** The workflow's safety check rejected the patch, so `buildPatch` is missing. */
  buildPatchRejected?: boolean;
  /** The `sdk-NN` commit that the workflow rebuilt `buildPatch` on. */
  buildBase?: string;
  /** Logs the commit that it would push and each comment, instead of pushing and commenting. */
  dryRun: boolean;
  github: GitHub;
  runLogUrl?: string;
  log?: (message: string) => void;
};

/**
 * A backport to a branch without changesets. That branch tracks its `build/` folders, so the
 * workflow rebuilds those of `packages`, in `dirs`, before it pushes.
 */
export type BackportRebuild = { sdk: number; branch: string; packages: string[]; dirs: string[] };

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
 * The workspace packages, `packages/*` and `packages/@scope/*`, that HEAD changes, by name.
 * A moved file counts for both packages.
 */
async function readChangedPackagesAsync(
  worktree: string,
  base: string
): Promise<{ name: string; dir: string }[]> {
  const changedPaths = await gitIn(worktree)(
    'diff',
    '--name-only',
    '-z',
    '--no-renames',
    base,
    'HEAD',
    '--',
    'packages/'
  );
  const dirs = new Set(
    changedPaths.split('\0').flatMap((file) => /^packages\/(@[^/]+\/)?[^/]+/.exec(file)?.[0] ?? [])
  );
  const packages: { name: string; dir: string }[] = [];
  for (const dir of dirs) {
    const packageJson = path.join(worktree, dir, 'package.json');
    if (fs.existsSync(packageJson)) {
      const { name }: { name?: unknown } = JSON.parse(
        await fs.promises.readFile(packageJson, 'utf8')
      );
      if (typeof name === 'string') {
        packages.push({ name, dir });
      }
    }
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Cherry-picks the merge commit of a pull request on main onto `sdk-NN` and pushes it to that
 * branch. When the bot cannot push it, it comments the manual steps on the original pull request once.
 * A branch without changesets gets the changesets as `CHANGELOG.md` entries. It also tracks its
 * `build/` folders, so without `buildPatch` this returns what the workflow must rebuild, and pushes
 * nothing. With `buildPatch`, a second commit adds the rebuilt folders.
 */
export async function backportAsync(options: BackportOptions): Promise<BackportRebuild | void> {
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
  const pickCommands = `git fetch origin ${targetBranch}
git checkout ${targetBranch}
git pull --ff-only origin ${targetBranch}
git cherry-pick -x ${mergeSha}`;
  const pickSteps = `To backport it by hand:\n\n\`\`\`sh\n${pickCommands}\ngit push origin ${targetBranch}\n\`\`\``;
  // The push stays out of the block, so that running the block does not push a backport without its rebuild.
  const rebuildSteps = `To backport it by hand:\n\n\`\`\`sh\n${pickCommands}\n\`\`\`\n\nNext, move the summary of each \`.changeset/*.md\` file that this pull request adds into an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the file. Then rebuild the \`build/\` output of each package that the change touches, commit the result, and run \`git push origin ${targetBranch}\`.`;

  const repo = gitIn(options.repoDir);
  let usesChangesets: boolean | undefined;
  let manualSteps = pickSteps;
  const readChangesetConfigAsync = async (ref: string) => {
    usesChangesets = (await repo('ls-tree', '--name-only', ref, '.changeset/config.json')) !== '';
    manualSteps = usesChangesets ? pickSteps : rebuildSteps;
  };
  let tempDir: string | undefined;
  try {
    if (!(await repo('ls-remote', 'origin', `refs/heads/${targetBranch}`))) {
      log(`${targetBranch} does not exist, so there is nothing to backport to.`);
      return;
    }
    // Before the fetch, the ref may be missing. Then the plain steps stay.
    await readChangesetConfigAsync(`refs/remotes/origin/${targetBranch}`).catch(() => {});
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
      const tip = await repo('rev-parse', `refs/remotes/origin/${targetBranch}`);
      await readChangesetConfigAsync(tip);
      return tip;
    };
    let base = await fetchTargetAsync();
    // A branch made from main after the merge already holds the change. When it changed the same
    // lines later, the cherry-pick conflicts instead of coming out empty.
    if (await github.branchContainsAsync(targetBranch, mergeSha)) {
      await commentAsync(
        `This change is already on \`${targetBranch}\`: the branch contains ${mergeSha}. No backport was made.`
      );
      return;
    }
    if (options.buildPatch !== undefined && !fs.existsSync(options.buildPatch)) {
      const reason = options.buildPatchRejected
        ? `The rebuilt \`build/\` patch for \`${targetBranch}\` failed the bot's safety check, so the bot did not backport this pull request. A person must rebuild \`build/\` and push the backport.`
        : `The rebuild of the \`build/\` folders for \`${targetBranch}\` failed, so the bot did not backport this pull request.`;
      await commentAsync(`${reason}${runLog}\n\n${manualSteps}`);
      throw new Error(reason);
    }
    if (options.buildPatch !== undefined && !options.buildBase) {
      throw new Error('buildPatch needs buildBase, the sdk-NN commit that it was built on.');
    }
    await repo('worktree', 'add', '--quiet', '--detach', worktree, base);
    const git = gitIn(worktree);

    for (let attempt = 1; ; attempt++) {
      if (options.buildPatch !== undefined && base !== options.buildBase) {
        const reason = `\`${targetBranch}\` moved after the rebuild, so the rebuilt \`build/\` folders may be stale and the bot did not backport this pull request. Re-run the workflow.`;
        await commentAsync(`${reason}${runLog}\n\n${manualSteps}`);
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

      if (!usesChangesets) {
        const added = await git('diff', '-z', '--name-only', '--diff-filter=A', base, 'HEAD');
        const addedChangesets = added.split('\0').filter(isChangesetPath);
        if (addedChangesets.length > 0) {
          // The conversion reads and writes these with the token in the environment.
          const changelogs = (await git('ls-files', '-z', '--', '*CHANGELOG.md')).split('\0');
          for (const file of [...addedChangesets, ...changelogs].filter(Boolean)) {
            if (!(await fs.promises.lstat(path.join(worktree, file))).isFile()) {
              const reason = `\`${file}\` is not a regular file on \`${targetBranch}\`, so the bot did not move the changesets into \`CHANGELOG.md\` entries and did not backport this pull request.`;
              await commentAsync(`${reason}${runLog}\n\n${manualSteps}`);
              throw new Error(reason);
            }
          }
          await convertChangesetsAsync(worktree, addedChangesets, {
            number: prNumber,
            author: options.author,
          });
          await git('add', '-A');
          await git('commit', '--quiet', '--amend', '--no-edit');
        }

        if (options.buildPatch === undefined) {
          const packages = await readChangedPackagesAsync(worktree, base);
          if (packages.length > 0) {
            const names = packages.map(({ name }) => name);
            log(`${targetBranch} tracks build/, so the workflow rebuilds ${names.join(', ')}.`);
            const dirs = packages.map(({ dir }) => dir);
            return { sdk: sdkVersion, branch: targetBranch, packages: names, dirs };
          }
        } else if ((await fs.promises.stat(options.buildPatch)).size > 0) {
          try {
            await git('apply', '--index', options.buildPatch);
          } catch (error) {
            await commentAsync(
              `The rebuilt \`build/\` folders do not apply to the backport on \`${targetBranch}\`, so the bot did not backport this pull request.${runLog}\n\n${manualSteps}`
            );
            throw error;
          }
          await git('commit', '--quiet', '-m', 'Rebuild build/');
        }
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
