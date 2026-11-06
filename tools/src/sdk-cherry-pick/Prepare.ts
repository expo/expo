import fs from 'node:fs';
import path from 'node:path';

import {
  BackportChangelogReport,
  runBackportChangelogCheckAsync,
} from '../commands/CheckBackportChangelogCommand';
import {
  BackportChangesetConversionReport,
  convertBackportChangesetsAsync,
} from '../commands/ConvertBackportChangesetsCommand';
import {
  BackportChangesetList,
  listBackportChangesetsAsync,
} from '../commands/ListBackportChangesetsCommand';
import { SdkCherryPickConfig } from './Config';
import { findBackportCommit, findManualBackport, selectBotBackports } from './Decisions';
import { GitHubClient } from './GitHub';
import { Cli, FatalError, Output, stripTrailingNewlines } from './Process';
import { StateDir } from './State';
import {
  Conversion,
  UsesChangesets,
  backportBody,
  backportTitle,
  buildNote,
  commentText,
  conflictList,
  errorList,
  manualSteps,
} from './Text';

const AUTHOR = /^[A-Za-z0-9-]+$/;
const SHA = /^[0-9a-f]{40}$/;
const CHANGESET_PATH = /^\.changeset\/[A-Za-z0-9._-]+\.md$/;
const PACKAGE_NAME = /^[@A-Za-z0-9._/-]+$/;
// No path segment starts with a dot, so `.` and `..` cannot occur.
const CHANGELOG_PATH = /^(packages|templates)\/([A-Za-z0-9@_-][A-Za-z0-9@._-]*\/)+CHANGELOG\.md$/;
const REGULAR_FILE_MODE = '100644';

// Hooks and fsmonitor are configuration that could run a program. The target tree is data only.
export const TARGET_GIT_OPTIONS = [
  '-c',
  'core.hooksPath=/dev/null',
  '-c',
  'core.fsmonitor=false',
  '-c',
  'user.name=Expo Bot',
  '-c',
  'user.email=expo-bot@users.noreply.github.com',
];

export type PullRequest = { mergeSha: string; title: string; author: string };

export type PrepareDependencies = { github: GitHubClient; output: Output };

/** What prepare records for publish. */
type Prepared =
  | { outcome: 'skip'; reason: string }
  | { outcome: 'comment'; comment: string }
  | { outcome: 'open-pr-from-branch'; body: string }
  | { outcome: 'open-pr'; body: string; targetTip: string; commit: string; buildDirs: string[] };

/** The commit to open the backport from, and what it did with the changesets. */
type Converted = { head: string; conversion: Conversion };

/** A cherry-pick that applied cleanly in a temporary worktree of the target branch. */
type CherryPick = {
  config: SdkCherryPickConfig;
  pullRequest: PullRequest;
  output: Output;
  /** Runs git in the temporary worktree. */
  git: Cli;
  targetDir: string;
  /** The cherry-pick commit. */
  base: string;
};

const skip = (reason: string): Prepared => ({ outcome: 'skip', reason });
const comment = (text: string): Prepared => ({ outcome: 'comment', comment: text });

function isPrepared<T extends object>(value: T | Prepared): value is Prepared {
  return 'outcome' in value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function lines(texts: readonly string[]): string {
  return texts.map((text) => `${text}\n`).join('');
}

/**
 * Cherry-picks the pull request onto the target branch, converts its changesets, and records what
 * publish does. It reads changesets and other text that the pull request author wrote, so it runs
 * with a read-only token.
 */
export async function prepareAsync(
  config: SdkCherryPickConfig,
  { github, output }: PrepareDependencies
): Promise<PullRequest> {
  const state = new StateDir(config.stateDir);
  await state.resetAsync();
  const pullRequest = await loadPullRequestAsync(config, github);
  await state.writeAsync('pull-request-loaded', '');
  await state.writeAsync(
    'title',
    `${backportTitle(config.targetBranch, pullRequest.title, config.prNumber)}\n`
  );
  await recordAsync(state, await decideAsync(config, pullRequest, { github, output }), output);
  return pullRequest;
}

async function loadPullRequestAsync(
  config: SdkCherryPickConfig,
  github: GitHubClient
): Promise<PullRequest> {
  let { mergeSha, title, author } = config.pullRequest;
  if (!mergeSha || !title || !author) {
    const view = await github.viewPullRequestAsync(config.prNumber);
    if (view.state !== 'MERGED') {
      throw new FatalError(`#${config.prNumber} is not merged.`);
    }
    if (view.baseRefName !== 'main') {
      throw new FatalError(`#${config.prNumber} did not merge into main.`);
    }
    ({ mergeSha, title, author } = view);
  }
  if (!SHA.test(mergeSha)) {
    throw new FatalError(`MERGE_SHA "${mergeSha}" is not a commit SHA.`);
  }
  return { mergeSha, title, author };
}

async function recordAsync(state: StateDir, prepared: Prepared, output: Output): Promise<void> {
  switch (prepared.outcome) {
    case 'skip':
      await output.log(`${prepared.reason} Nothing to publish.`);
      break;
    case 'comment':
      await state.writeAsync('comment.md', `${prepared.comment}\n`);
      break;
    case 'open-pr-from-branch':
      await state.writeAsync('body.md', prepared.body);
      break;
    case 'open-pr':
      await state.writeAsync('body.md', prepared.body);
      await state.writeAsync('target-tip', `${prepared.targetTip}\n`);
      await state.writeAsync('commit', `${prepared.commit}\n`);
      await state.writeAsync('build-dirs', `${JSON.stringify(prepared.buildDirs)}\n`);
      break;
  }
  await state.writeAsync('outcome', `${prepared.outcome}\n`);
}

async function decideAsync(
  config: SdkCherryPickConfig,
  pullRequest: PullRequest,
  { github, output }: PrepareDependencies
): Promise<Prepared> {
  const { prNumber, targetBranch, workBranch } = config;
  const { mergeSha } = pullRequest;
  const git = new Cli('git', ['-C', config.repoDir]);
  const branchExistsAsync = async (branch: string) =>
    (await git.outputAsync(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`])) !== '';

  // An `sdk-NN` label can name an SDK that a change affects, or a release that has no branch yet.
  if (!(await branchExistsAsync(targetBranch))) {
    return skip(`The ${targetBranch} branch does not exist, so no backport was made.`);
  }

  // A pull request that merged into main before the branch cut is already on the target branch,
  // and a label added later must not backport it again. The clone is shallow, so the compare API
  // tells whether the target branch contains the merge commit.
  const ancestry = await github.compareStatusAsync(targetBranch, mergeSha);
  if (ancestry === 'behind' || ancestry === 'identical') {
    return skip(
      `#${prNumber} is already on ${targetBranch}: ${targetBranch} contains ${mergeSha}.`
    );
  }

  const backportCommit = findBackportCommit(
    await github.commitsSinceCutAsync(targetBranch),
    prNumber
  );
  if (backportCommit) {
    return skip(
      `#${prNumber} is already on ${targetBranch}: the subject of ${backportCommit.sha} names it first.`
    );
  }

  // The changelog trailer links the author, and the check accepts only the login of a GitHub user.
  if (!AUTHOR.test(pullRequest.author)) {
    return comment(
      `This pull request has the \`${targetBranch}\` label, but a bot or an app authored it, so no backport was made. Backport it to \`${targetBranch}\` by hand.`
    );
  }

  const botBackports = selectBotBackports(
    await github.listBotBackportsAsync(workBranch, targetBranch),
    config.repo
  );
  const workBranchExists = await branchExistsAsync(workBranch);
  if (botBackports.merged) {
    return skip(`The backport ${botBackports.merged} already merged.`);
  }
  if (botBackports.open) {
    return skip(`The backport ${botBackports.open} is already open.`);
  }
  // Someone closed the backport on purpose. Without the branch, the bot makes a new backport.
  if (botBackports.closed && workBranchExists) {
    return comment(
      `The backport ${botBackports.closed} was closed without merging, so no new backport was made. Reopen it, or delete the \`${workBranch}\` branch so that the bot can make a new backport.`
    );
  }

  const manualBackport = findManualBackport(
    await github.searchOpenBackportsAsync(targetBranch, prNumber),
    prNumber
  );
  if (manualBackport !== undefined) {
    return comment(
      `A backport into \`${targetBranch}\` is already open in #${manualBackport}, so no second backport was made.`
    );
  }

  // An earlier run pushed the branch, then failed to open the pull request.
  if (workBranchExists) {
    return {
      outcome: 'open-pr-from-branch',
      body: `Backport of #${prNumber} to \`${targetBranch}\`. An earlier run of the bot pushed \`${workBranch}\` but did not open a pull request for it, so this run opened one from the branch as it is. Review the branch before you merge.\n`,
    };
  }

  const isShallow = (await git.outputAsync(['rev-parse', '--is-shallow-repository'])) === 'true';
  await git.runAsync(
    [
      'fetch',
      '--quiet',
      '--no-tags',
      ...(isShallow ? ['--depth=2'] : []),
      'origin',
      mergeSha,
      `+refs/heads/${targetBranch}:refs/remotes/origin/${targetBranch}`,
    ],
    { stdout: 'inherit' }
  );
  const targetTip = await git.outputAsync([
    'rev-parse',
    '--verify',
    `refs/remotes/origin/${targetBranch}^{commit}`,
  ]);
  const { status: configStatus } = await git.tryAsync(
    ['cat-file', '-e', `${targetTip}:.changeset/config.json`],
    { stderr: 'ignore' }
  );
  const usesChangesets = configStatus === 0 ? 'yes' : 'no';
  const parents = await git.outputAsync(['rev-list', '--parents', '-n', '1', mergeSha]);
  if (parents.split(/\s+/).filter(Boolean).length !== 2) {
    return comment(
      `The merge commit ${mergeSha} does not have exactly one parent, so the bot cannot cherry-pick it.\n\n${manualSteps(config, mergeSha, usesChangesets)}`
    );
  }

  const runDir = await fs.promises.mkdtemp(`${config.tempRoot}/sdk-cherry-pick.`);
  const targetDir = path.join(runDir, 'target');
  try {
    await git.runAsync(['worktree', 'add', '--quiet', '--detach', targetDir, targetTip], {
      stdout: 'inherit',
    });
    const targetGit = new Cli('git', ['-C', targetDir, ...TARGET_GIT_OPTIONS]);
    const logFile = path.join(runDir, 'cherry-pick.log');
    if ((await targetGit.tryAsync(['cherry-pick', '-x', mergeSha], { logFile })).status !== 0) {
      await output.untrusted(await fs.promises.readFile(logFile, 'utf8'));
      return await describeFailedCherryPickAsync(config, mergeSha, targetGit, usesChangesets);
    }

    const cherryPick: CherryPick = {
      config,
      pullRequest,
      output,
      git: targetGit,
      targetDir,
      base: await targetGit.outputAsync(['rev-parse', 'HEAD']),
    };
    const converted =
      usesChangesets === 'no'
        ? await convertChangesetsAsync(cherryPick)
        : await checkKeptChangesetsAsync(cherryPick);
    if (isPrepared(converted)) {
      return converted;
    }
    const buildDirs = await findBuiltSourceDirsAsync(cherryPick);
    return {
      outcome: 'open-pr',
      body: backportBody({
        targetBranch,
        prNumber,
        mergeSha,
        conversion: converted.conversion,
        buildNote: buildNote(targetBranch, buildDirs),
      }),
      targetTip,
      commit: converted.head,
      buildDirs,
    };
  } finally {
    if (fs.existsSync(targetDir)) {
      await git.tryAsync(['worktree', 'remove', '--force', targetDir], { stdout: 'inherit' });
    }
    await fs.promises.rm(runDir, { recursive: true, force: true });
  }
}

async function describeFailedCherryPickAsync(
  config: SdkCherryPickConfig,
  mergeSha: string,
  git: Cli,
  usesChangesets: UsesChangesets
): Promise<Prepared> {
  const { targetBranch, runLogLink } = config;
  let conflicts = '';
  let empty = false;
  if ((await git.tryAsync(['rev-parse', '--quiet', '--verify', 'CHERRY_PICK_HEAD'])).status === 0) {
    conflicts = conflictList(
      (await git.runAsync(['diff', '--name-only', '--diff-filter=U'])).stdout
    );
    empty =
      !conflicts && (await git.tryAsync(['diff', '--cached', '--quiet', 'HEAD'])).status === 0;
    await git.runAsync(['cherry-pick', '--abort'], { stdout: 'inherit' });
  }
  if (conflicts) {
    return comment(
      `The cherry-pick of ${mergeSha} onto \`${targetBranch}\` has conflicts, so no backport pull request was opened.${runLogLink} These files conflict:\n\n\`\`\`\n${conflicts}\n\`\`\`\n\n${manualSteps(config, mergeSha, usesChangesets)}`
    );
  }
  if (empty) {
    return comment(
      `This change is already on \`${targetBranch}\`: the cherry-pick of ${mergeSha} is empty. No backport was made.`
    );
  }
  return comment(
    `The cherry-pick of ${mergeSha} onto \`${targetBranch}\` failed, so no backport pull request was opened.${runLogLink}\n\n${manualSteps(config, mergeSha, usesChangesets)}`
  );
}

/**
 * Lists the changesets that the cherry-pick adds with the code of `et list-backport-changesets`.
 * When that fails, it returns the comment.
 */
async function listChangesetsAsync(
  { config, pullRequest, output, targetDir, base }: CherryPick,
  usesChangesets: 'yes' | 'no'
): Promise<BackportChangesetList | Prepared> {
  const couldNotList = comment(
    `The bot could not list the changesets of this pull request with \`et list-backport-changesets\`, so no backport pull request was opened.${config.runLogLink}\n\n${manualSteps(config, pullRequest.mergeSha, usesChangesets)}`
  );
  let list: BackportChangesetList;
  try {
    list = await listBackportChangesetsAsync({ repo: targetDir, base });
  } catch (error) {
    await output.untrusted(`${error instanceof Error ? error.stack : String(error)}\n`);
    return couldNotList;
  }
  await output.untrusted(
    lines([
      ...list.changesets.map((changeset) => `Changeset: ${changeset}`),
      ...list.packages.map(
        ({ name, changelog }) => `Package: ${name} -> ${changelog ?? '(not found)'}`
      ),
      ...list.errors,
    ])
  );
  return hasControlCharacterInReport(list) ? couldNotList : list;
}

/**
 * The pull request author controls the values of the report. A control character in one could forge
 * a line of a comment or the run log, so the bot treats the report as unusable.
 */
export function hasControlCharacterInReport(list: BackportChangesetList): boolean {
  const values = [
    ...list.errors,
    ...list.changesets,
    ...list.packages.flatMap(({ name, changelog }) => [name, changelog ?? '']),
  ];
  return values.some(hasControlCharacter);
}

function hasControlCharacter(text: string): boolean {
  return [...text].some((character) => character <= '\u001f' || character === '\u007f');
}

/** A branch with changesets keeps them, but a changeset that names a package the branch does not have breaks its release. */
async function checkKeptChangesetsAsync(cherryPick: CherryPick): Promise<Converted | Prepared> {
  const { config, pullRequest, base } = cherryPick;
  const { targetBranch } = config;
  const list = await listChangesetsAsync(cherryPick, 'yes');
  if (isPrepared(list)) {
    return list;
  }
  if (list.errors.length > 0) {
    return comment(
      `The changesets of this pull request do not fit \`${targetBranch}\`, so no backport pull request was opened:\n\n${errorList(list.errors)}\n\nIn the backport, fix each changeset. For example, remove a package that \`${targetBranch}\` does not have.\n\n${manualSteps(config, pullRequest.mergeSha, 'yes')}`
    );
  }
  return { head: base, conversion: list.changesets.length === 0 ? 'none' : 'kept' };
}

/** The mode of each entry that `git ls-tree` prints, such as `100644` for a regular file. */
function treeModes(lsTreeOutput: string): string {
  return stripTrailingNewlines(lsTreeOutput)
    .split('\n')
    .map((entry) => entry.split(' ')[0])
    .join('\n');
}

async function convertChangesetsAsync(cherryPick: CherryPick): Promise<Converted | Prepared> {
  const { config, pullRequest, output, git, base } = cherryPick;
  const { targetBranch, prNumber } = config;
  const steps = manualSteps(config, pullRequest.mergeSha, 'no');

  // The conversion and the check read the changesets and the packages with the same code, so the
  // files that the conversion edits are the files that the check expects.
  const list = await listChangesetsAsync(cherryPick, 'no');
  if (isPrepared(list)) {
    return list;
  }

  for (const changeset of list.changesets) {
    const mode = CHANGESET_PATH.test(changeset)
      ? treeModes((await git.runAsync(['ls-tree', base, '--', changeset])).stdout)
      : '';
    if (mode !== REGULAR_FILE_MODE) {
      return comment(
        `The changeset \`${commentText(changeset)}\` is not a regular file with a plain name, so the bot did not convert it.\n\n${steps}`
      );
    }
  }
  for (const { name } of list.packages) {
    if (!PACKAGE_NAME.test(name)) {
      return comment(
        `A changeset names the package \`${commentText(name)}\`, which is not a valid package name, so the bot did not convert the changesets.\n\n${steps}`
      );
    }
  }
  if (list.errors.length > 0) {
    return comment(
      `The changesets of this pull request do not fit \`${targetBranch}\`, so no backport pull request was opened:\n\n${errorList(list.errors)}\n\n${steps}`
    );
  }
  if (list.changesets.length === 0) {
    return { head: base, conversion: 'none' };
  }

  const changelogs = list.packages.map((pkg) => pkg.changelog ?? '');
  for (const changelog of changelogs) {
    if (
      !CHANGELOG_PATH.test(changelog) ||
      treeModes((await git.tryAsync(['ls-tree', base, '--', changelog])).stdout) !==
        REGULAR_FILE_MODE
    ) {
      return comment(
        `\`${commentText(changelog)}\` is missing or is not a regular file on \`${targetBranch}\`, so the bot did not convert the changesets.\n\n${steps}`
      );
    }
  }

  if (changelogs.length > 0) {
    const failure = await addEntriesAsync(cherryPick, list.changesets.length);
    if (failure) {
      return failure;
    }
  } else {
    await output.log(
      'The changesets name no packages, so there are no CHANGELOG.md entries to add. The bot only deletes them.'
    );
  }
  await git.runAsync(['rm', '--quiet', '--', ...list.changesets], { stdout: 'inherit' });
  await git.runAsync(['add', '-A'], { stdout: 'inherit' });

  const report = await checkChangelogAsync(cherryPick);
  const tree = report.ok ? (report.tree ?? '') : '';
  if (!SHA.test(tree)) {
    return comment(
      `The changesets of this pull request were converted, but \`et check-backport-changelog\` rejected the result, so no backport pull request was opened.\n\n${errorList(report.errors)}\n\n${steps}`
    );
  }

  const [conversion, subject, body]: [Conversion, string, string] =
    changelogs.length > 0
      ? [
          'converted',
          'Convert changesets to CHANGELOG entries',
          `${targetBranch} does not use changesets. This commit moves the changesets of #${prNumber} into CHANGELOG.md entries.`,
        ]
      : [
          'deleted',
          'Delete changesets',
          `${targetBranch} does not use changesets. The changesets of #${prNumber} name no packages, so this commit deletes them.`,
        ];
  const head = await git.outputAsync(['commit-tree', tree, '-p', base, '-m', subject, '-m', body]);
  return { head, conversion };
}

/** Adds the CHANGELOG.md entries with the code of `et convert-backport-changesets`. When that fails, it returns the comment. */
async function addEntriesAsync(
  { config, pullRequest, output, targetDir, base }: CherryPick,
  changesetCount: number
): Promise<Prepared | null> {
  await output.log(
    `Converting ${changesetCount} changeset(s) with et convert-backport-changesets.`
  );
  let report: BackportChangesetConversionReport;
  try {
    report = await convertBackportChangesetsAsync({
      repo: targetDir,
      base,
      pr: config.prNumber,
      author: pullRequest.author,
    });
  } catch (error) {
    report = { ok: false, errors: [`The conversion could not run: ${errorMessage(error)}`] };
  }
  await output.untrusted(
    report.ok ? 'Each changeset is converted into CHANGELOG.md entries.\n' : lines(report.errors)
  );
  if (report.ok) {
    return null;
  }
  const steps = manualSteps(config, pullRequest.mergeSha, 'no');
  if (report.errors.length > 0) {
    return comment(
      `The changesets of this pull request do not fit \`${config.targetBranch}\`, so no backport pull request was opened:\n\n${errorList(report.errors)}\n\n${steps}`
    );
  }
  return comment(
    `The bot could not convert the changesets of this pull request with \`et convert-backport-changesets\`, so no backport pull request was opened.${config.runLogLink}\n\n${steps}`
  );
}

/** Checks the staged conversion with the code of `et check-backport-changelog`. */
async function checkChangelogAsync({
  config,
  pullRequest,
  output,
  targetDir,
  base,
}: CherryPick): Promise<BackportChangelogReport> {
  let report: BackportChangelogReport;
  try {
    report = await runBackportChangelogCheckAsync({
      repo: targetDir,
      base,
      pr: config.prNumber,
      author: pullRequest.author,
    });
  } catch (error) {
    report = { ok: false, errors: [`The check could not run: ${errorMessage(error)}`] };
  }
  await output.untrusted(
    report.ok
      ? `Each backported changeset is converted into CHANGELOG.md entries.\nTree: ${report.tree}\n`
      : lines(report.errors)
  );
  return report;
}

/** The package directories whose `src/` the cherry-pick changes and whose `build/` the branch tracks. */
async function findBuiltSourceDirsAsync({ git, base }: CherryPick): Promise<string[]> {
  const { stdout } = await git.tryAsync([
    'diff-tree',
    '-r',
    '-z',
    '--no-commit-id',
    '--name-only',
    base,
  ]);
  const sourceDirs = new Set<string>();
  for (const file of stdout.split('\0').slice(0, -1)) {
    if (file.includes('/src/') && !file.includes('/__tests__/') && !file.includes('/__mocks__/')) {
      sourceDirs.add(file.slice(0, file.indexOf('/src/')));
    }
  }
  const builtDirs: string[] = [];
  for (const dir of sourceDirs) {
    const { status } = await git.tryAsync(['cat-file', '-e', `${base}:${dir}/build`], {
      stderr: 'ignore',
    });
    if (status === 0) {
      builtDirs.push(dir);
    }
  }
  return builtDirs;
}
