import { vol } from 'memfs';

import * as Log from '../../log';
import { createCheckpointAsync, printCheckpointAsync } from '../create';
import { event } from '../events';
import {
  GitError,
  commitSnapshotTreeAsync,
  resolveWorkTreeAsync,
  writeSnapshotTreeAsync,
} from '../git';
import { readCheckpoints } from '../store';

jest.mock('../../log');
jest.mock('../events', () => ({
  event: jest.fn(),
  debugEvent: Object.assign(jest.fn(), { error: jest.fn((error) => error) }),
}));
jest.mock('../git', () => ({
  ...jest.requireActual('../git'),
  resolveWorkTreeAsync: jest.fn(),
  writeSnapshotTreeAsync: jest.fn(),
  commitSnapshotTreeAsync: jest.fn(),
}));

const projectRoot = '/repo/apps/app';
const worktree = { toplevel: '/repo', prefix: 'apps/app' };

/** Everything the command printed, joined into one string. */
function printed(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

beforeEach(() => {
  vol.reset();
  vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
  jest.mocked(resolveWorkTreeAsync).mockResolvedValue(worktree);
  jest.mocked(writeSnapshotTreeAsync).mockResolvedValue({ tree: 'tree-oid', files: 12 });
  jest.mocked(commitSnapshotTreeAsync).mockResolvedValue('c0ffee1234567890abcdef');
});

describe(createCheckpointAsync, () => {
  it(`should snapshot the project and store the record`, async () => {
    const result = await createCheckpointAsync(projectRoot, {
      label: 'exagent install',
      argv: ['exagent', 'install', 'expo-sqlite'],
    });

    expect(result.skipped).toBeNull();
    expect(result.files).toBe(12);
    expect(result.record).toEqual({
      id: 'c0ffee1234567890abcdef',
      label: 'exagent install',
      createdAt: expect.any(String),
      argv: ['exagent', 'install', 'expo-sqlite'],
      path: 'apps/app',
    });
    expect(readCheckpoints(projectRoot)).toEqual([result.record]);
    expect(commitSnapshotTreeAsync).toHaveBeenCalledWith(
      worktree,
      'tree-oid',
      expect.stringContaining('exagent install')
    );
    expect(event).toHaveBeenCalledWith('created', {
      id: 'c0ffee1234567890abcdef',
      label: 'exagent install',
      files: 12,
      path: 'apps/app',
    });
  });

  it(`should skip a project that is not in a git work tree`, async () => {
    jest.mocked(resolveWorkTreeAsync).mockResolvedValue(null);

    const result = await createCheckpointAsync(projectRoot, { label: 'exagent install' });

    expect(result.record).toBeNull();
    expect(result.skipped).toBe('not-a-git-repo');
    expect(writeSnapshotTreeAsync).not.toHaveBeenCalled();
    expect(readCheckpoints(projectRoot)).toEqual([]);
    expect(event).toHaveBeenCalledWith('skipped', {
      label: 'exagent install',
      reason: 'not-a-git-repo',
    });
  });

  it(`should skip a project where git tracks no file`, async () => {
    jest.mocked(writeSnapshotTreeAsync).mockResolvedValue({ tree: 'empty-tree', files: 0 });

    const result = await createCheckpointAsync(projectRoot, { label: 'exagent agents:setup' });

    expect(result.skipped).toBe('no-files');
    expect(commitSnapshotTreeAsync).not.toHaveBeenCalled();
    expect(readCheckpoints(projectRoot)).toEqual([]);
  });

  it(`should report a failing git command as a skip instead of throwing`, async () => {
    jest
      .mocked(writeSnapshotTreeAsync)
      .mockRejectedValue(new GitError(['add', '-A', '.'], 'fatal: index lock exists', 128));

    const result = await createCheckpointAsync(projectRoot, { label: 'exagent install' });

    expect(result.skipped).toBe('git-failed');
    expect(result.detail).toContain('index lock exists');
    expect(readCheckpoints(projectRoot)).toEqual([]);
  });
});

describe(printCheckpointAsync, () => {
  it(`should print the id and what the checkpoint covers`, async () => {
    await printCheckpointAsync(projectRoot, { label: 'before refactor' });

    expect(printed()).toContain('c0ffee1');
    expect(printed()).toContain('before refactor');
    expect(printed()).toContain('12 files');
    expect(printed()).toContain('npx exagent checkpoint:undo');
  });

  it(`should print one JSON object with a stable key set`, async () => {
    await printCheckpointAsync(projectRoot, { json: true });

    const report = JSON.parse(printed());
    expect(Object.keys(report).sort()).toEqual([
      'created',
      'createdAt',
      'files',
      'id',
      'label',
      'path',
      'skipped',
    ]);
    expect(report).toMatchObject({ created: true, files: 12, skipped: null });
  });

  it(`should fail with a next action when the project is not in a git repository`, async () => {
    jest.mocked(resolveWorkTreeAsync).mockResolvedValue(null);

    await expect(printCheckpointAsync(projectRoot, {})).rejects.toMatchObject({
      code: 'NOT_A_GIT_REPO',
      suggestedCommand: expect.stringContaining('git init'),
    });
  });

  it(`should fail when the snapshot could not be written`, async () => {
    jest
      .mocked(writeSnapshotTreeAsync)
      .mockRejectedValue(new GitError(['write-tree'], 'fatal: broken', 128));

    await expect(printCheckpointAsync(projectRoot, {})).rejects.toMatchObject({
      code: 'CHECKPOINT_FAILED',
    });
  });
});
