// The git commands this CLI runs, and the two questions every caller starts from: can git run here,
// and what work tree is this project in.
//
// One identity for every invocation — `@expo/agent-cli`, not the user — because what this CLI writes through
// git is a machine artifact, and a project whose `user.email` is unset must still be able to make
// one. Hooks and pagers belong to the user's own git commands, so they are turned off here.
//
// The plumbing that made a checkpoint out of these calls left with the command
// (`src/deferred/checkpoint/git.ts`, llp/0016); what stayed is what `src/impact/changedFiles.ts`
// reads a diff with.

import { spawn } from 'child_process';

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

interface RunGitOptions {
  cwd: string;
  /** Absolute path of the index file to use instead of the repository's own. */
  indexFile?: string;
}

/**
 * Run one git command and return its stdout.
 *
 * The identity of a snapshot commit is `@expo/agent-cli`, not the user: the commit is a machine artifact,
 * and a project whose `user.email` is unset must still be able to make one.
 *
 * @throws {GitError} when git exits non-zero or cannot be started.
 */
export async function runGitAsync(args: string[], options: RunGitOptions): Promise<string> {
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
        GIT_AUTHOR_NAME: 'expo-agent-cli',
        GIT_AUTHOR_EMAIL: 'agent-cli@expo.dev',
        GIT_COMMITTER_NAME: 'expo-agent-cli',
        GIT_COMMITTER_EMAIL: 'agent-cli@expo.dev',
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
