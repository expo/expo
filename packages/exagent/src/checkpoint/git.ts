// @ref llp/0008-guardrails.rfc.md §Summary — Checkpoints
// The git plumbing checkpoints are made of. Every call here is a plumbing command run with a
// temporary index file, so a snapshot and a restore are invisible to the user's git state:
//
// - the user's index (`.git/index`) is never read or written — `GIT_INDEX_FILE` points somewhere
//   else, and the file is deleted when the call returns;
// - `HEAD`, branches, tags, and the reflog are never moved, and no ref is created;
// - nothing is committed onto the user's branch: `git commit-tree` writes a commit object that
//   no ref points at, which is why `git log` and `git status` do not mention it.
//
// The one thing a checkpoint leaves in the repository is loose objects. Because no ref points at
// them, `git gc --prune=now` deletes them; the default `gc` keeps unreachable objects for two
// weeks, which is far longer than a checkpoint is meant to live.

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/** A git command that exited non-zero, or could not be started at all. */
export class GitError extends Error {
  constructor(
    readonly argv: string[],
    readonly stderr: string,
    readonly exitCode: number | null
  ) {
    super(
      `git ${argv.join(' ')} failed${exitCode == null ? '' : ` with exit code ${exitCode}`}${
        stderr.trim() ? `: ${stderr.trim().split('\n')[0]}` : ''
      }`
    );
    this.name = 'GitError';
  }
}

/** The git work tree a project lives in. */
export interface GitWorkTree {
  /** Absolute path of the work tree root, which every plumbing call runs from. */
  toplevel: string;
  /**
   * The project's directory relative to {@link toplevel}, `""` when the project *is* the root.
   * Checkpoints are scoped to it, so a project inside a monorepo never snapshots its siblings.
   */
  prefix: string;
}

/** One path a checkpoint tree and the working tree disagree on. */
export interface TreeDiffEntry {
  /**
   * `restore` — the checkpoint has this file and the working tree has other contents or none;
   * `keep` — the working tree has this file and the checkpoint does not, so undo leaves it.
   */
  kind: 'restore' | 'keep';
  /** Path relative to the work tree root. */
  path: string;
}

interface RunGitOptions {
  cwd: string;
  /** Absolute path of the index file to use instead of the repository's own. */
  indexFile?: string;
}

/**
 * Run one git command and return its stdout.
 *
 * The identity of a snapshot commit is `exagent`, not the user: the commit is a machine artifact,
 * and a project whose `user.email` is unset must still be able to make one.
 *
 * @throws {GitError} when git exits non-zero or cannot be started.
 */
async function runGitAsync(args: string[], options: RunGitOptions): Promise<string> {
  const { stdout, stderr, exitCode, spawnError } = await new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    spawnError?: Error;
  }>((resolve) => {
    const child = spawn('git', args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...(options.indexFile ? { GIT_INDEX_FILE: options.indexFile } : null),
        GIT_AUTHOR_NAME: 'exagent',
        GIT_AUTHOR_EMAIL: 'exagent@expo.dev',
        GIT_COMMITTER_NAME: 'exagent',
        GIT_COMMITTER_EMAIL: 'exagent@expo.dev',
        // Hooks and pagers belong to the user's own git commands, not to a snapshot.
        GIT_PAGER: 'cat',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error: Error) =>
      resolve({ stdout, stderr, exitCode: null, spawnError: error })
    );
    child.on('close', (code) => resolve({ stdout, stderr, exitCode: code }));
  });

  if (spawnError || exitCode !== 0) {
    throw new GitError(args, spawnError ? spawnError.message : stderr, exitCode);
  }
  return stdout;
}

/**
 * The work tree the project is in, or null when it is not in one.
 *
 * A project outside git is the normal case for a fresh `create-expo-app`, so this is a question,
 * not a failure: the caller skips the checkpoint and runs anyway.
 */
export async function resolveWorkTreeAsync(projectRoot: string): Promise<GitWorkTree | null> {
  try {
    const output = await runGitAsync(
      ['rev-parse', '--is-inside-work-tree', '--show-toplevel', '--show-prefix'],
      { cwd: projectRoot }
    );
    const [insideWorkTree, toplevel, prefix = ''] = output.split('\n');
    if (insideWorkTree?.trim() !== 'true' || !toplevel?.trim()) {
      return null;
    }
    return { toplevel: toplevel.trim(), prefix: prefix.trim().replace(/\/$/, '') };
  } catch {
    return null;
  }
}

/**
 * Write a tree object holding the project's current files, without touching the user's index.
 *
 * `git add -A .` runs with the project directory as the working directory and a temporary, empty
 * index, so the tree holds exactly the files git would track under the project: `.gitignore` is
 * honored, which is what keeps `node_modules` and `ios/Pods` out of a snapshot.
 *
 * `.expo` is then dropped from that index, because it is where the checkpoint store itself lives:
 * a project that does not gitignore `.expo` must not end up with an undo that rewrites the list of
 * checkpoints it was reading. It is removed after the fact rather than excluded by a pathspec,
 * because `git add` fails on a pathspec that names an ignored path — which `.expo` usually is.
 *
 * @returns the tree object id and the number of files it holds.
 */
export async function writeSnapshotTreeAsync(
  worktree: GitWorkTree,
  projectRoot: string
): Promise<{ tree: string; files: number }> {
  return await withTemporaryIndexAsync(async (indexFile) => {
    await runGitAsync(['add', '-A', '.'], { cwd: projectRoot, indexFile });
    // `--ignore-unmatch` makes this a no-op for the usual project, where `.expo` is ignored and
    // never reached the index in the first place.
    await runGitAsync(['rm', '--cached', '-r', '-q', '-f', '--ignore-unmatch', '.expo'], {
      cwd: projectRoot,
      indexFile,
    });
    const tree = (await runGitAsync(['write-tree'], { cwd: worktree.toplevel, indexFile })).trim();
    const files = (await runGitAsync(['ls-files', '-z'], { cwd: worktree.toplevel, indexFile }))
      .split('\0')
      .filter(Boolean).length;
    return { tree, files };
  });
}

/**
 * Wrap a tree in a commit object, so the snapshot has a message and a point of comparison.
 *
 * The commit's parent is `HEAD` when the branch has one, which makes `git show <id>` and
 * `git diff HEAD <id>` work for anyone inspecting a checkpoint by hand. It creates no ref, so the
 * commit is not on the user's branch and no history was rewritten.
 */
export async function commitSnapshotTreeAsync(
  worktree: GitWorkTree,
  tree: string,
  message: string
): Promise<string> {
  const parent = await resolveHeadAsync(worktree);
  const args = ['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', message];
  return (await runGitAsync(args, { cwd: worktree.toplevel })).trim();
}

/** The current commit, or null on an unborn branch (a repository with no commit yet). */
async function resolveHeadAsync(worktree: GitWorkTree): Promise<string | null> {
  try {
    return (await runGitAsync(['rev-parse', 'HEAD'], { cwd: worktree.toplevel })).trim();
  } catch {
    return null;
  }
}

/** Whether an object id still exists in the repository, i.e. was not pruned by `git gc`. */
export async function objectExistsAsync(worktree: GitWorkTree, oid: string): Promise<boolean> {
  try {
    await runGitAsync(['cat-file', '-e', `${oid}^{commit}`], { cwd: worktree.toplevel });
    return true;
  } catch {
    return false;
  }
}

/**
 * What restoring a checkpoint over the current files would change.
 *
 * The comparison is tree against tree, so it answers before anything is written. A path git
 * reports as deleted is one the working tree has and the checkpoint does not — undo keeps those,
 * so they are reported as `keep`.
 */
export async function diffTreesAsync(
  worktree: GitWorkTree,
  currentTree: string,
  checkpointTree: string
): Promise<TreeDiffEntry[]> {
  const output = await runGitAsync(
    ['diff-tree', '-r', '-z', '--name-status', currentTree, checkpointTree],
    { cwd: worktree.toplevel }
  );
  return parseNameStatus(output);
}

/**
 * Parse `git diff-tree -z --name-status` output, which is a NUL-separated stream of alternating
 * status letters and paths.
 */
export function parseNameStatus(output: string): TreeDiffEntry[] {
  const fields = output.split('\0').filter((field) => field !== '');
  const entries: TreeDiffEntry[] = [];
  for (let index = 0; index + 1 < fields.length; index += 2) {
    const status = fields[index]![0];
    const filePath = fields[index + 1]!;
    // `A`/`M` mean the checkpoint holds contents for the path, `D` that only the working tree has
    // it. Renames and copies are not asked for (no `-M`), so no third field appears.
    entries.push({ kind: status === 'D' ? 'keep' : 'restore', path: filePath });
  }
  return entries;
}

/**
 * Write every file of a tree into the working tree, overwriting what is there.
 *
 * `git read-tree` fills a temporary index with the checkpoint's tree, and
 * `git checkout-index -a -f` writes that index into the working tree from the work tree root.
 * Neither command touches `HEAD`, a branch, or the user's index — and `checkout-index` only ever
 * writes files, so anything created after the checkpoint stays exactly where it is.
 */
export async function restoreTreeAsync(worktree: GitWorkTree, treeish: string): Promise<void> {
  await withTemporaryIndexAsync(async (indexFile) => {
    await runGitAsync(['read-tree', treeish], { cwd: worktree.toplevel, indexFile });
    await runGitAsync(['checkout-index', '-a', '-f'], { cwd: worktree.toplevel, indexFile });
  });
}

/**
 * Run one operation against an index file of its own, in the system temporary directory.
 *
 * Outside the repository on purpose: a stale index left behind by a killed process is then a
 * temporary file, not something inside the user's `.git`.
 */
async function withTemporaryIndexAsync<T>(
  operation: (indexFile: string) => Promise<T>
): Promise<T> {
  const indexFile = path.join(
    os.tmpdir(),
    `exagent-checkpoint-index-${process.pid}-${Math.random().toString(36).slice(2)}`
  );
  try {
    return await operation(indexFile);
  } finally {
    await fs.promises.rm(indexFile, { force: true }).catch(() => {});
  }
}
