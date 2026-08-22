import { vol } from 'memfs';

import * as Log from '../../log';
import { event } from '../events';
import {
  GitError,
  diffTreesAsync,
  objectExistsAsync,
  resolveWorkTreeAsync,
  restoreTreeAsync,
  writeSnapshotTreeAsync,
} from '../git';
import { printCheckpointListAsync, printUndoAsync, undoAsync } from '../restore';
import { CHECKPOINTS_FILE_NAME } from '../store';
import type { CheckpointRecord } from '../types';

jest.mock('../../log');
jest.mock('../events', () => ({
  event: jest.fn(),
  debugEvent: Object.assign(jest.fn(), { error: jest.fn((error) => error) }),
}));
jest.mock('../git', () => ({
  ...jest.requireActual('../git'),
  resolveWorkTreeAsync: jest.fn(),
  writeSnapshotTreeAsync: jest.fn(),
  objectExistsAsync: jest.fn(),
  diffTreesAsync: jest.fn(),
  restoreTreeAsync: jest.fn(),
}));

const projectRoot = '/repo/apps/app';
const worktree = { toplevel: '/repo', prefix: 'apps/app' };
const storeFile = `${projectRoot}/.expo/${CHECKPOINTS_FILE_NAME}`;

function record(overrides: Partial<CheckpointRecord> = {}): CheckpointRecord {
  return {
    id: 'c0ffee1234567890',
    label: 'exagent install',
    createdAt: new Date().toISOString(),
    argv: ['exagent', 'install', 'expo-sqlite'],
    path: 'apps/app',
    ...overrides,
  };
}

function seedCheckpoints(records: CheckpointRecord[]): void {
  vol.fromJSON({ [storeFile]: JSON.stringify({ checkpoints: records }) });
}

/** Everything the command printed, joined into one string. */
function printed(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

beforeEach(() => {
  vol.reset();
  vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
  jest.mocked(resolveWorkTreeAsync).mockResolvedValue(worktree);
  jest.mocked(writeSnapshotTreeAsync).mockResolvedValue({ tree: 'current-tree', files: 12 });
  jest.mocked(objectExistsAsync).mockResolvedValue(true);
  jest.mocked(restoreTreeAsync).mockResolvedValue(undefined);
  jest.mocked(diffTreesAsync).mockResolvedValue([
    { kind: 'restore', path: 'apps/app/package.json' },
    { kind: 'restore', path: 'apps/app/app/index.tsx' },
    { kind: 'keep', path: 'apps/app/notes.md' },
  ]);
});

describe(undoAsync, () => {
  it(`should restore the newest checkpoint and report what changed`, async () => {
    seedCheckpoints([record({ id: 'newer' }), record({ id: 'older' })]);

    const result = await undoAsync(projectRoot, {});

    expect(result.record.id).toBe('newer');
    expect(result.filesRestored).toBe(2);
    expect(result.filesKept).toBe(1);
    // Paths are reported relative to the project, not to the work tree root.
    expect(result.paths).toEqual(['package.json', 'app/index.tsx']);
    expect(restoreTreeAsync).toHaveBeenCalledWith(worktree, 'newer');
    expect(event).toHaveBeenCalledWith('restored', {
      id: 'newer',
      label: 'exagent install',
      filesRestored: 2,
      filesKept: 1,
    });
  });

  it(`should restore the checkpoint an abbreviated id names`, async () => {
    seedCheckpoints([record({ id: 'newer' }), record({ id: 'older-one' })]);

    const result = await undoAsync(projectRoot, { id: 'older' });

    expect(result.record.id).toBe('older-one');
    expect(restoreTreeAsync).toHaveBeenCalledWith(worktree, 'older-one');
  });

  it(`should compare the checkpoint against the project as it is now`, async () => {
    seedCheckpoints([record()]);

    await undoAsync(projectRoot, {});

    expect(writeSnapshotTreeAsync).toHaveBeenCalledWith(worktree, projectRoot);
    expect(diffTreesAsync).toHaveBeenCalledWith(worktree, 'current-tree', 'c0ffee1234567890');
  });

  it(`should suggest making a checkpoint when the project has none`, async () => {
    await expect(undoAsync(projectRoot, {})).rejects.toMatchObject({
      code: 'NO_CHECKPOINTS',
      suggestedCommand: 'npx exagent checkpoint',
    });
    expect(restoreTreeAsync).not.toHaveBeenCalled();
  });

  it(`should suggest the list when the id is unknown`, async () => {
    seedCheckpoints([record()]);

    await expect(undoAsync(projectRoot, { id: 'nope' })).rejects.toMatchObject({
      code: 'CHECKPOINT_NOT_FOUND',
      suggestedCommand: 'npx exagent undo --list',
    });
  });

  it(`should report a checkpoint whose git object is gone`, async () => {
    seedCheckpoints([record()]);
    jest.mocked(objectExistsAsync).mockResolvedValue(false);

    await expect(undoAsync(projectRoot, {})).rejects.toMatchObject({
      code: 'CHECKPOINT_OBJECT_MISSING',
      suggestedCommand: 'npx exagent undo --list',
    });
    expect(restoreTreeAsync).not.toHaveBeenCalled();
  });

  it(`should report a project that is no longer in a git work tree`, async () => {
    seedCheckpoints([record()]);
    jest.mocked(resolveWorkTreeAsync).mockResolvedValue(null);

    await expect(undoAsync(projectRoot, {})).rejects.toMatchObject({ code: 'NOT_A_GIT_REPO' });
  });

  it(`should report a failing restore as a command error`, async () => {
    seedCheckpoints([record()]);
    jest
      .mocked(restoreTreeAsync)
      .mockRejectedValue(new GitError(['checkout-index', '-a', '-f'], 'fatal: broken', 128));

    await expect(undoAsync(projectRoot, {})).rejects.toMatchObject({
      code: 'UNDO_FAILED',
    });
  });
});

describe(printUndoAsync, () => {
  it(`should print what was restored, what was kept, and the next action`, async () => {
    seedCheckpoints([record()]);

    await printUndoAsync(projectRoot, {});

    expect(printed()).toContain('c0ffee1');
    expect(printed()).toContain('exagent install');
    expect(printed()).toContain('2 files');
    expect(printed()).toContain('package.json');
    // The follow-up of a restored manifest.
    expect(printed()).toContain('npm install');
  });

  it(`should print one JSON object with a stable key set`, async () => {
    seedCheckpoints([record()]);

    await printUndoAsync(projectRoot, { json: true });

    const report = JSON.parse(printed());
    expect(Object.keys(report).sort()).toEqual([
      'createdAt',
      'filesKept',
      'filesRestored',
      'followups',
      'id',
      'label',
      'paths',
      'restored',
    ]);
    expect(report).toMatchObject({
      restored: true,
      id: 'c0ffee1234567890',
      filesRestored: 2,
      filesKept: 1,
      paths: ['package.json', 'app/index.tsx'],
    });
    expect(report.followups[0].id).toBe('install-dependencies');
  });
});

describe(printCheckpointListAsync, () => {
  it(`should print the stored checkpoints without touching git`, async () => {
    seedCheckpoints([
      record({ id: 'aaaaaaa111', label: 'exagent setup' }),
      record({ id: 'bbbbbbb222', label: 'manual', argv: ['exagent', 'checkpoint'] }),
    ]);

    await printCheckpointListAsync(projectRoot, {});

    expect(printed()).toContain('aaaaaaa');
    expect(printed()).toContain('exagent setup');
    expect(printed()).toContain('exagent checkpoint');
    expect(resolveWorkTreeAsync).not.toHaveBeenCalled();
  });

  it(`should say when the project has no checkpoint`, async () => {
    await printCheckpointListAsync(projectRoot, {});

    expect(printed()).toContain('No checkpoint');
  });

  it(`should print one JSON object holding the checkpoints`, async () => {
    seedCheckpoints([record({ id: 'aaaaaaa111' })]);

    await printCheckpointListAsync(projectRoot, { json: true });

    const report = JSON.parse(printed());
    expect(Object.keys(report)).toEqual(['checkpoints']);
    expect(report.checkpoints).toEqual([
      {
        id: 'aaaaaaa111',
        label: 'exagent install',
        createdAt: expect.any(String),
        age: expect.any(String),
        argv: ['exagent', 'install', 'expo-sqlite'],
        path: 'apps/app',
      },
    ]);
  });
});
