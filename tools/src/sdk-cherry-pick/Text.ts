import { SdkCherryPickConfig } from './Config';
import { PULL_REQUEST_REFERENCE } from './Decisions';
import { stripTrailingNewlines } from './Process';

/** Whether the target branch uses changesets, as far as the caller knows. */
export type UsesChangesets = 'yes' | 'no' | 'unknown';

/** What the backport does with the changesets of the original pull request. */
export type Conversion = 'kept' | 'none' | 'converted' | 'deleted';

const MAX_CONFLICTS = 50;
const MAX_ERRORS = 10;

function truncate(text: string, length: number): string {
  return Array.from(text).slice(0, length).join('');
}

/**
 * Text that a pull request author controls reaches a comment only through this, through
 * `errorList`, or inside a code block without backticks. Without backticks it cannot end a code
 * span, and without `@` it cannot mention anyone.
 */
export function commentText(text: string): string {
  return truncate(text.replace(/[`@]/g, '').replace(/[\r\n]/g, ' '), 200);
}

/** Lists errors as Markdown for a comment. Each error is one code span, so `@` cannot mention anyone. */
export function errorList(errors: readonly string[]): string {
  const lines = errors
    .slice(0, MAX_ERRORS)
    .map((error) => `- \`${truncate(error.replace(/`/g, '').replace(/[\r\n]/g, ' '), 300)}\``);
  if (errors.length > MAX_ERRORS) {
    lines.push(`- ${errors.length - MAX_ERRORS} more. The run log lists every error.`);
  }
  return lines.join('\n');
}

/**
 * The squash merge appends ` (#<backport>)`, so the first `(#N)` of the subject names the original
 * pull request. `et check-sdk-prs` reads that number, so a `(#N)` in the title loses its parentheses.
 * The loop repeats until none is left: `((#N))` becomes `(#N)` after one pass.
 */
export function backportTitle(targetBranch: string, title: string, prNumber: string): string {
  let rewritten = title;
  while (PULL_REQUEST_REFERENCE.test(rewritten)) {
    rewritten = rewritten.replace(PULL_REQUEST_REFERENCE, '#$1');
  }
  return `[${targetBranch}] ${stripTrailingNewlines(rewritten)} (#${prNumber})`;
}

export function manualSteps(
  config: Pick<SdkCherryPickConfig, 'prNumber' | 'targetBranch' | 'workBranch'>,
  mergeSha: string,
  usesChangesets: UsesChangesets
): string {
  const { prNumber, targetBranch, workBranch } = config;
  const steps = [
    'To backport it by hand:',
    '',
    '```sh',
    `git fetch origin main ${targetBranch}`,
    `git checkout -b ${workBranch} origin/${targetBranch}`,
    `git cherry-pick -x ${mergeSha || `<merge commit of #${prNumber}>`}`,
    '```',
  ].join('\n');
  switch (usesChangesets) {
    case 'yes':
      return steps;
    case 'no':
      return `${steps}\n\n\`${targetBranch}\` does not use changesets. For each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names. Then delete the changeset file.`;
    case 'unknown':
      return `${steps}\n\nIf \`${targetBranch}\` has no \`.changeset/config.json\`, it does not use changesets. Then, for each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the changeset file.`;
  }
}

/**
 * Turns the output of `git diff --name-only --diff-filter=U` into the content of a code block. A
 * backtick in a file name would end the code block of the comment.
 */
export function conflictList(nameOnlyOutput: string): string {
  const conflicts = stripTrailingNewlines(nameOnlyOutput.replace(/`/g, ''));
  if (!conflicts) {
    return '';
  }
  const lines = conflicts.split('\n');
  if (lines.length <= MAX_CONFLICTS) {
    return conflicts;
  }
  return `${lines.slice(0, MAX_CONFLICTS).join('\n')}\n${lines.length - MAX_CONFLICTS} more. The run log lists every file.`;
}

export const REBUILD_COMMIT_MESSAGE = 'Rebuild build/ for the backport';

/**
 * Older branches track `build/` in git, and check-packages fails when it does not match the source.
 * A separate job rebuilds these directories, and `et sdk-cherry-pick apply-build` pushes the result.
 * `dirs` are the package directories whose source changes and whose `build/` the branch tracks.
 */
export function buildNote(targetBranch: string, dirs: readonly string[]): string {
  if (dirs.length === 0) {
    return '';
  }
  const list = [...new Set(dirs.map(commentText))]
    .sort()
    .map((dir) => `- \`${dir}/build\``)
    .join('\n');
  return `\n\`${targetBranch}\` tracks \`build/\` directories in git. This backport changes the source next to these directories:\n\n${list}\n\nThe bot rebuilds them and pushes any change in a commit named \`${REBUILD_COMMIT_MESSAGE}\`. If that commit does not appear and check-packages fails, run \`et check-packages --since origin/${targetBranch}\` in a checkout of this branch, then commit and push the changed \`build/\` files.`;
}

/** Why the rebuilt `build/` directories did not reach the backport branch. */
export type RebuildFailure = 'rebuild' | 'apply' | 'rejected' | 'moved' | 'push';

const REBUILD_FAILURES: Record<RebuildFailure, string> = {
  rebuild: 'The bot could not rebuild the `build/` directories of this backport.',
  apply: 'The bot could not apply the rebuilt `build/` directories to this branch.',
  rejected:
    'The bot did not push the rebuilt `build/` directories, because the rebuild changed files that the bot does not push.',
  moved:
    'The bot did not push the rebuilt `build/` directories, because this branch changed after the bot opened this pull request.',
  push: 'The bot could not push the rebuilt `build/` directories to this branch.',
};

/** The comment on the backport pull request. The workflow posts the `push` text when apply-build cannot start. */
export function rebuildFailedComment(
  config: Pick<SdkCherryPickConfig, 'targetBranch' | 'runLogLink'>,
  failure: RebuildFailure
): string {
  return `${REBUILD_FAILURES[failure]}${config.runLogLink}\n\nTo rebuild them by hand, run \`et check-packages --since origin/${config.targetBranch}\` in a checkout of this branch. Then commit and push the changed \`build/\` files.`;
}

function conversionNote(conversion: Conversion, targetBranch: string, prNumber: string): string {
  switch (conversion) {
    case 'kept':
      return `\`${targetBranch}\` uses changesets, so the changesets of #${prNumber} are kept as they are. \`et list-backport-changesets\` found each package that they name on \`${targetBranch}\`.`;
    case 'none':
      return `#${prNumber} adds no changesets.`;
    case 'converted':
      return `\`${targetBranch}\` does not use changesets. The bot moved the changesets of #${prNumber} into \`CHANGELOG.md\` entries. It put each entry in a section by the bump type: \`patch\` and \`none\` under \`### 💡 Others\`, and \`minor\` under \`### 🎉 New features\`. \`et check-backport-changelog\` checked the result. That change is in its own commit. Before you merge, check that each entry is in the right section.`;
    case 'deleted':
      return `\`${targetBranch}\` does not use changesets. The changesets of #${prNumber} name no packages, so the bot deleted them, and \`et check-backport-changelog\` checked the result. That change is in its own commit.`;
  }
}

export function backportBody(options: {
  targetBranch: string;
  prNumber: string;
  mergeSha: string;
  conversion: Conversion;
  buildNote: string;
}): string {
  const { targetBranch, prNumber, mergeSha, conversion } = options;
  return `Backport of #${prNumber} to \`${targetBranch}\`. The bot cherry-picked ${mergeSha} with \`git cherry-pick -x\`.

${conversionNote(conversion, targetBranch, prNumber)}
${options.buildNote}
`;
}
