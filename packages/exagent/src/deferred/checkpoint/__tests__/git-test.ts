// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import {
  GitError,
  commitSnapshotTreeAsync,
  diffTreesAsync,
  objectExistsAsync,
  parseNameStatus,
  resolveWorkTreeAsync,
  restoreTreeAsync,
  writeSnapshotTreeAsync,
  type GitWorkTree,
} from '../git';

type GitReply = { stdout?: string; stderr?: string; code?: number };

/** Answer every `git` spawn from a table keyed by the first argument. */
function mockGit(replies: (args: string[]) => GitReply): void {
  jest.mocked(spawn).mockImplementation(((_command: string, args: string[]) => {
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    const reply = replies(args);
    process.nextTick(() => {
      if (reply.stdout) {
        child.stdout.emit('data', reply.stdout);
      }
      if (reply.stderr) {
        child.stderr.emit('data', reply.stderr);
      }
      child.emit('close', reply.code ?? 0);
    });
    return child;
  }) as any);
}

/** Every `git` invocation, as `[args, options]` pairs. */
function gitCalls(): { args: string[]; cwd: string; indexFile?: string }[] {
  return jest.mocked(spawn).mock.calls.map(([, args, options]: any) => ({
    args,
    cwd: options.cwd,
    indexFile: options.env.GIT_INDEX_FILE,
  }));
}

const worktree: GitWorkTree = { toplevel: '/repo', prefix: 'apps/app' };
const projectRoot = '/repo/apps/app';

describe(writeSnapshotTreeAsync, () => {
  it(`should keep the checkpoint store itself out of the snapshot`, async () => {
    mockGit((args) => (args[0] === 'write-tree' ? { stdout: 'tree-oid\n' } : {}));

    await writeSnapshotTreeAsync(worktree, projectRoot);

    // Restoring a snapshot that held `.expo/exagent-checkpoints.json` would put back an older
    // list of checkpoints than the one the undo just read.
    expect(gitCalls()[1]!.args).toEqual([
      'rm',
      '--cached',
      '-r',
      '-q',
      '-f',
      '--ignore-unmatch',
      '.expo',
    ]);
    expect(gitCalls()[1]!.cwd).toBe(projectRoot);
  });

  it(`should stage the project into a temporary index and write its tree`, async () => {
    mockGit((args) => {
      if (args[0] === 'write-tree') {
        return { stdout: 'tree-oid\n' };
      }
      if (args[0] === 'ls-files') {
        return { stdout: 'apps/app/package.json\0apps/app/index.js\0' };
      }
      return {};
    });

    await expect(writeSnapshotTreeAsync(worktree, projectRoot)).resolves.toEqual({
      tree: 'tree-oid',
      files: 2,
    });

    const calls = gitCalls();
    expect(calls.map((call) => call.args)).toEqual([
      ['add', '-A', '.'],
      ['rm', '--cached', '-r', '-q', '-f', '--ignore-unmatch', '.expo'],
      ['write-tree'],
      ['ls-files', '-z'],
    ]);
    // `add` runs in the project, so the snapshot covers the project and not its siblings.
    expect(calls[0]!.cwd).toBe(projectRoot);
    expect(calls[2]!.cwd).toBe('/repo');
    // The user's index is never the one being written.
    const indexFiles = calls.map((call) => call.indexFile);
    expect(indexFiles.every((file) => !!file && !file.includes('/repo'))).toBe(true);
    expect(new Set(indexFiles).size).toBe(1);
  });

  it(`should fail with the git error when staging fails`, async () => {
    mockGit((args) =>
      args[0] === 'add' ? { stderr: 'fatal: index lock exists\n', code: 128 } : {}
    );

    await expect(writeSnapshotTreeAsync(worktree, projectRoot)).rejects.toThrow(GitError);
    await expect(writeSnapshotTreeAsync(worktree, projectRoot)).rejects.toThrow(
      'fatal: index lock exists'
    );
  });
});

describe(commitSnapshotTreeAsync, () => {
  it(`should commit the tree with HEAD as its parent and create no ref`, async () => {
    mockGit((args) => {
      if (args[0] === 'rev-parse') {
        return { stdout: 'head-oid\n' };
      }
      return { stdout: 'commit-oid\n' };
    });

    await expect(commitSnapshotTreeAsync(worktree, 'tree-oid', 'checkpoint')).resolves.toBe(
      'commit-oid'
    );

    const calls = gitCalls();
    expect(calls[1]!.args).toEqual([
      'commit-tree',
      'tree-oid',
      '-p',
      'head-oid',
      '-m',
      'checkpoint',
    ]);
    // No `update-ref`, no `commit`: nothing lands on the user's branch.
    expect(calls.some((call) => ['update-ref', 'commit', 'checkout'].includes(call.args[0]!))).toBe(
      false
    );
  });

  it(`should commit without a parent on an unborn branch`, async () => {
    mockGit((args) =>
      args[0] === 'rev-parse'
        ? { stderr: 'fatal: ambiguous argument HEAD', code: 128 }
        : { stdout: 'commit-oid\n' }
    );

    await expect(commitSnapshotTreeAsync(worktree, 'tree-oid', 'checkpoint')).resolves.toBe(
      'commit-oid'
    );
    expect(gitCalls()[1]!.args).toEqual(['commit-tree', 'tree-oid', '-m', 'checkpoint']);
  });
});

describe(objectExistsAsync, () => {
  it(`should report an object that is still in the repository`, async () => {
    mockGit(() => ({}));

    await expect(objectExistsAsync(worktree, 'commit-oid')).resolves.toBe(true);
    expect(gitCalls()[0]!.args).toEqual(['cat-file', '-e', 'commit-oid^{commit}']);
  });

  it(`should report an object that git has pruned`, async () => {
    mockGit(() => ({ code: 1 }));

    await expect(objectExistsAsync(worktree, 'commit-oid')).resolves.toBe(false);
  });
});

describe(restoreTreeAsync, () => {
  it(`should read the tree into a temporary index and check it out`, async () => {
    mockGit(() => ({}));

    await restoreTreeAsync(worktree, 'commit-oid');

    const calls = gitCalls();
    expect(calls.map((call) => call.args)).toEqual([
      ['read-tree', 'commit-oid'],
      ['checkout-index', '-a', '-f'],
    ]);
    // Both run from the work tree root, where the index paths are rooted.
    expect(calls.every((call) => call.cwd === '/repo')).toBe(true);
    expect(calls[0]!.indexFile).toBe(calls[1]!.indexFile);
    expect(calls[0]!.indexFile).not.toContain('/repo');
  });
});

describe(diffTreesAsync, () => {
  it(`should ask git for the paths the two trees disagree on`, async () => {
    mockGit(() => ({ stdout: 'M\0apps/app/package.json\0D\0apps/app/new.ts\0' }));

    await expect(diffTreesAsync(worktree, 'current-tree', 'checkpoint-tree')).resolves.toEqual([
      { kind: 'restore', path: 'apps/app/package.json' },
      { kind: 'keep', path: 'apps/app/new.ts' },
    ]);
    expect(gitCalls()[0]!.args).toEqual([
      'diff-tree',
      '-r',
      '-z',
      '--name-status',
      'current-tree',
      'checkpoint-tree',
    ]);
  });
});

describe(parseNameStatus, () => {
  it(`should read nothing from an empty diff`, () => {
    expect(parseNameStatus('')).toEqual([]);
  });

  it(`should map a modified and a recreated file onto a restore`, () => {
    expect(parseNameStatus('M\0changed.ts\0A\0deleted-since.ts\0')).toEqual([
      { kind: 'restore', path: 'changed.ts' },
      { kind: 'restore', path: 'deleted-since.ts' },
    ]);
  });

  it(`should map a file the checkpoint does not have onto a keep`, () => {
    expect(parseNameStatus('D\0created-since.ts\0')).toEqual([
      { kind: 'keep', path: 'created-since.ts' },
    ]);
  });

  it(`should ignore a trailing status without a path`, () => {
    expect(parseNameStatus('M\0changed.ts\0M')).toEqual([{ kind: 'restore', path: 'changed.ts' }]);
  });
});
