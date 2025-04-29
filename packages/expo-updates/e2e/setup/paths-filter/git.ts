import { File, ChangeStatus } from './file';
import { core, getExecOutput } from './paths-filter-dependencies';

export const NULL_SHA = '0000000000000000000000000000000000000000';
export const HEAD = 'HEAD';

export async function getChangesInLastCommit(): Promise<File[]> {
  core.startGroup(`Change detection in last commit`);
  let output = '';
  try {
    output = (
      await getExecOutput('git', [
        'log',
        '--format=',
        '--no-renames',
        '--name-status',
        '-z',
        '-n',
        '1',
      ])
    ).stdout;
  } finally {
    fixStdOutNullTermination();
    core.endGroup();
  }

  return parseGitDiffOutput(output);
}

export async function getChanges(base: string, head: string): Promise<File[]> {
  const baseRef = await ensureRefAvailable(base);
  const headRef = await ensureRefAvailable(head);

  // Get differences between ref and HEAD
  core.startGroup(`Change detection ${base}..${head}`);
  let output = '';
  try {
    // Two dots '..' change detection - directly compares two versions
    output = (
      await getExecOutput('git', [
        'diff',
        '--no-renames',
        '--name-status',
        '-z',
        `${baseRef}..${headRef}`,
      ])
    ).stdout;
  } finally {
    fixStdOutNullTermination();
    core.endGroup();
  }

  return parseGitDiffOutput(output);
}

export async function getChangesOnHead(): Promise<File[]> {
  // Get current changes - both staged and unstaged
  core.startGroup(`Change detection on HEAD`);
  let output = '';
  try {
    output = (await getExecOutput('git', ['diff', '--no-renames', '--name-status', '-z', 'HEAD']))
      .stdout;
  } finally {
    fixStdOutNullTermination();
    core.endGroup();
  }

  return parseGitDiffOutput(output);
}

export async function getChangesSinceMergeBase(
  base: string,
  head: string,
  initialFetchDepth: number
): Promise<File[]> {
  let baseRef: string | undefined;
  let headRef: string | undefined;
  async function hasMergeBase(): Promise<boolean> {
    if (baseRef === undefined || headRef === undefined) {
      return false;
    }
    return (
      (await getExecOutput('git', ['merge-base', baseRef, headRef], { ignoreReturnCode: true }))
        .exitCode === 0
    );
  }

  let noMergeBase = false;
  core.startGroup(`Searching for merge-base ${base}...${head}`);
  try {
    baseRef = await getLocalRef(base);
    headRef = await getLocalRef(head);
    if (!(await hasMergeBase())) {
      await getExecOutput('git', [
        'fetch',
        '--no-tags',
        `--depth=${initialFetchDepth}`,
        'origin',
        base,
        head,
      ]);
      if (baseRef === undefined || headRef === undefined) {
        baseRef = baseRef ?? (await getLocalRef(base));
        headRef = headRef ?? (await getLocalRef(head));
        if (baseRef === undefined || headRef === undefined) {
          await getExecOutput('git', ['fetch', '--tags', '--depth=1', 'origin', base, head], {
            ignoreReturnCode: true, // returns exit code 1 if tags on remote were updated - we can safely ignore it
          });
          baseRef = baseRef ?? (await getLocalRef(base));
          headRef = headRef ?? (await getLocalRef(head));
          if (baseRef === undefined) {
            throw new Error(
              `Could not determine what is ${base} - fetch works but it's not a branch, tag or commit SHA`
            );
          }
          if (headRef === undefined) {
            throw new Error(
              `Could not determine what is ${head} - fetch works but it's not a branch, tag or commit SHA`
            );
          }
        }
      }

      let depth = initialFetchDepth;
      let lastCommitCount = await getCommitCount();
      while (!(await hasMergeBase())) {
        depth = Math.min(depth * 2, Number.MAX_SAFE_INTEGER);
        await getExecOutput('git', ['fetch', `--deepen=${depth}`, 'origin', base, head]);
        const commitCount = await getCommitCount();
        if (commitCount === lastCommitCount) {
          core.info('No more commits were fetched');
          core.info('Last attempt will be to fetch full history');
          await getExecOutput('git', ['fetch']);
          if (!(await hasMergeBase())) {
            noMergeBase = true;
          }
          break;
        }
        lastCommitCount = commitCount;
      }
    }
  } finally {
    core.endGroup();
  }

  // Three dots '...' change detection - finds merge-base and compares against it
  let diffArg = `${baseRef}...${headRef}`;
  if (noMergeBase) {
    core.warning(
      'No merge base found - change detection will use direct <commit>..<commit> comparison'
    );
    diffArg = `${baseRef}..${headRef}`;
  }

  // Get changes introduced on ref compared to base
  core.startGroup(`Change detection ${diffArg}`);
  let output = '';
  try {
    output = (await getExecOutput('git', ['diff', '--no-renames', '--name-status', '-z', diffArg]))
      .stdout;
  } finally {
    fixStdOutNullTermination();
    core.endGroup();
  }

  return parseGitDiffOutput(output);
}

export function parseGitDiffOutput(output: string): File[] {
  const tokens = output.split('\u0000').filter((s) => s.length > 0);
  const files: File[] = [];
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    files.push({
      status: statusMap[tokens[i]],
      filename: tokens[i + 1],
    });
  }
  return files;
}

export async function listAllFilesAsAdded(): Promise<File[]> {
  core.startGroup('Listing all files tracked by git');
  let output = '';
  try {
    output = (await getExecOutput('git', ['ls-files', '-z'])).stdout;
  } finally {
    fixStdOutNullTermination();
    core.endGroup();
  }

  return output
    .split('\u0000')
    .filter((s) => s.length > 0)
    .map((path) => ({
      status: ChangeStatus.Added,
      filename: path,
    }));
}

export async function getCurrentRef(): Promise<string> {
  core.startGroup(`Get current git ref`);
  try {
    const branch = (await getExecOutput('git', ['branch', '--show-current'])).stdout.trim();
    if (branch) {
      return branch;
    }

    const describe = await getExecOutput('git', ['describe', '--tags', '--exact-match'], {
      ignoreReturnCode: true,
    });
    if (describe.exitCode === 0) {
      return describe.stdout.trim();
    }

    return (await getExecOutput('git', ['rev-parse', HEAD])).stdout.trim();
  } finally {
    core.endGroup();
  }
}

export function getShortName(ref: string): string {
  if (!ref) return '';

  const heads = 'refs/heads/';
  const tags = 'refs/tags/';

  if (ref.startsWith(heads)) return ref.slice(heads.length);
  if (ref.startsWith(tags)) return ref.slice(tags.length);

  return ref;
}

export function isGitSha(ref: string): boolean {
  return /^[a-z0-9]{40}$/.test(ref);
}

async function hasCommit(ref: string): Promise<boolean> {
  return (
    (await getExecOutput('git', ['cat-file', '-e', `${ref}^{commit}`], { ignoreReturnCode: true }))
      .exitCode === 0
  );
}

async function getCommitCount(): Promise<number> {
  const output = (await getExecOutput('git', ['rev-list', '--count', '--all'])).stdout;
  const count = parseInt(output);
  return isNaN(count) ? 0 : count;
}

async function getLocalRef(shortName: string): Promise<string | undefined> {
  if (isGitSha(shortName)) {
    return (await hasCommit(shortName)) ? shortName : undefined;
  }

  const output = (await getExecOutput('git', ['show-ref', shortName], { ignoreReturnCode: true }))
    .stdout;
  const refs = output
    .split(/\r?\n/g)
    .map((l) => l.match(/refs\/(?:(?:heads)|(?:tags)|(?:remotes\/origin))\/(.*)$/))
    .filter((match) => match !== null && match[1] === shortName)
    .map((match) => match?.[0] ?? ''); // match can't be null here but compiler doesn't understand that

  if (refs.length === 0) {
    return undefined;
  }

  const remoteRef = refs.find((ref) => ref.startsWith('refs/remotes/origin/'));
  if (remoteRef) {
    return remoteRef;
  }

  return refs[0];
}

async function ensureRefAvailable(name: string): Promise<string> {
  core.startGroup(`Ensuring ${name} is fetched from origin`);
  try {
    let ref = await getLocalRef(name);
    if (ref === undefined) {
      await getExecOutput('git', ['fetch', '--depth=1', '--no-tags', 'origin', name]);
      ref = await getLocalRef(name);
      if (ref === undefined) {
        await getExecOutput('git', ['fetch', '--depth=1', '--tags', 'origin', name]);
        ref = await getLocalRef(name);
        if (ref === undefined) {
          throw new Error(
            `Could not determine what is ${name} - fetch works but it's not a branch, tag or commit SHA`
          );
        }
      }
    }

    return ref;
  } finally {
    core.endGroup();
  }
}

function fixStdOutNullTermination(): void {
  // Previous command uses NULL as delimiters and output is printed to stdout.
  // We have to make sure next thing written to stdout will start on new line.
  // Otherwise things like ::set-output wouldn't work.
  core.info('');
}

const statusMap: { [char: string]: ChangeStatus } = {
  A: ChangeStatus.Added,
  C: ChangeStatus.Copied,
  D: ChangeStatus.Deleted,
  M: ChangeStatus.Modified,
  R: ChangeStatus.Renamed,
  U: ChangeStatus.Unmerged,
};
